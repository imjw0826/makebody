"""RIFE 4.25 flow estimator, with single-source (never crossfade) rendering.

Inference architecture adapted from Practical-RIFE's 4.25 model bundle.
Copyright (c) 2021 hzwer; MIT license in animation-RIFE-LICENSE.txt.
The pretrained network estimates image correspondence, not anatomical truth.
"""
import hashlib
import math
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from PIL import Image

WEIGHTS_SHA = '6615790efd627772917205db291f51cd392528a157ecbb2ecaeec3bff8eb6de2'


def warp(image, flow):
    h, w = image.shape[-2:]
    y, x = torch.meshgrid(torch.linspace(-1, 1, h), torch.linspace(-1, 1, w), indexing='ij')
    grid = torch.stack((x, y), 0).unsqueeze(0).to(image)
    delta = flow / flow.new_tensor([(w - 1) / 2, (h - 1) / 2]).view(1, 2, 1, 1)
    return F.grid_sample(image, (grid + delta).permute(0, 2, 3, 1), mode='bilinear', padding_mode='border', align_corners=True)


def conv(i, o):
    return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.LeakyReLU(.2, True))


class Head(nn.Module):
    def __init__(self):
        super().__init__()
        self.cnn0 = nn.Conv2d(3, 16, 3, 2, 1)
        self.cnn1 = nn.Conv2d(16, 16, 3, 1, 1)
        self.cnn2 = nn.Conv2d(16, 16, 3, 1, 1)
        self.cnn3 = nn.ConvTranspose2d(16, 4, 4, 2, 1)
        self.relu = nn.LeakyReLU(.2, True)

    def forward(self, x):
        return self.cnn3(self.relu(self.cnn2(self.relu(self.cnn1(self.relu(self.cnn0(x)))))))


class ResConv(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.conv = nn.Conv2d(c, c, 3, 1, 1)
        self.beta = nn.Parameter(torch.ones((1, c, 1, 1)), requires_grad=False)
        self.relu = nn.LeakyReLU(.2, True)

    def forward(self, x):
        return self.relu(self.conv(x) * self.beta + x)


class IFBlock(nn.Module):
    def __init__(self, i, c):
        super().__init__()
        self.conv0 = nn.Sequential(conv(i, c // 2), conv(c // 2, c))
        self.convblock = nn.Sequential(*(ResConv(c) for _ in range(8)))
        self.lastconv = nn.Sequential(nn.ConvTranspose2d(c, 52, 4, 2, 1), nn.PixelShuffle(2))

    def forward(self, x, flow, scale):
        x = F.interpolate(x, scale_factor=1 / scale, mode='bilinear', align_corners=False)
        if flow is not None:
            small = F.interpolate(flow, scale_factor=1 / scale, mode='bilinear', align_corners=False) / scale
            x = torch.cat((x, small), 1)
        tmp = F.interpolate(self.lastconv(self.convblock(self.conv0(x))), scale_factor=scale, mode='bilinear', align_corners=False)
        return tmp[:, :4] * scale, tmp[:, 4:5], tmp[:, 5:]


class IFNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.block0 = IFBlock(15, 192)
        self.block1 = IFBlock(28, 128)
        self.block2 = IFBlock(28, 96)
        self.block3 = IFBlock(28, 64)
        self.block4 = IFBlock(28, 32)
        self.encode = Head()

    def forward(self, a, b, t):
        f0, f1 = self.encode(a), self.encode(b)
        wa, wb, flow, mask = a, b, None, None
        for block, scale in zip([self.block0, self.block1, self.block2, self.block3, self.block4], [16, 8, 4, 2, 1]):
            if flow is None:
                flow, mask, feat = block(torch.cat((a, b, f0, f1, torch.full_like(a[:, :1], t)), 1), None, scale)
            else:
                delta, mask, feat = block(torch.cat((wa, wb, warp(f0, flow[:, :2]), warp(f1, flow[:, 2:]), torch.full_like(a[:, :1], t), mask, feat), 1), flow, scale)
                flow = flow + delta
            wa, wb = warp(a, flow[:, :2]), warp(b, flow[:, 2:])
        # Deliberately omit RIFE's alpha mixture. Every pixel comes from one
        # spatially warped endpoint; transparent duplicate bodies cannot occur.
        return wa if t <= .5 else wb


class Interpolator:
    def __init__(self, weights, threads=4):
        weights = Path(weights)
        if not weights.exists() or hashlib.sha256(weights.read_bytes()).hexdigest() != WEIGHTS_SHA:
            raise ValueError('Missing/wrong RIFE 4.25 weights. Run scripts/setup-animation.py --cache-dir <dir>.')
        torch.set_num_threads(threads)
        torch.use_deterministic_algorithms(True)
        self.model = IFNet().eval()
        state = torch.load(weights, map_location='cpu', weights_only=True)
        expected = self.model.state_dict()
        self.model.load_state_dict({k.removeprefix('module.'): v for k, v in state.items() if k.removeprefix('module.') in expected})
        self.cache = {}

    def between(self, a, b, t):
        if t < 1e-7:
            return a.copy()
        if t > 1 - 1e-7:
            return b.copy()
        w, h = a.size
        tensors = []
        for im in [a, b]:
            key = hashlib.sha256(im.tobytes()).digest()
            if key not in self.cache:
                tensor = torch.from_numpy(np.array(im)).permute(2, 0, 1).float().unsqueeze(0) / 255
                self.cache[key] = F.pad(tensor, (0, math.ceil(w / 64) * 64 - w, 0, math.ceil(h / 64) * 64 - h), mode='replicate')
            tensors.append(self.cache[key])
        with torch.inference_mode():
            out = self.model(*tensors, float(t))[0, :, :h, :w].permute(1, 2, 0).numpy()
        return Image.fromarray(np.uint8(np.rint(out.clip(0, 1) * 255)))

