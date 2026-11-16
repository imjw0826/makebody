"""Build safe looping GIFs and matching lossless playback assets.

Reads the fixed animation-originals.json snapshot, never a previous processed
export. See docs/ANIMATION_SMOOTHING.md for dependencies, provenance and limits.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import math
import os
from pathlib import Path
import subprocess
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('animation_flow', ROOT / 'scripts/animation-flow.py')
FLOW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FLOW)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_original(id, source, cache, originals_dir):
    """Only accept checksum-pinned originals; outputs can never become inputs."""
    if source['sourceId'] == 'custom':
        data = (ROOT / source['path']).read_bytes()
    else:
        original = cache / 'originals' / (source['sha256'] + '.gif')
        candidates = [original]
        if originals_dir:
            candidates.append(originals_dir / f'{id}.gif')
        candidates.append(ROOT / 'public/anatomy' / f'{id}.gif')
        data = next((p.read_bytes() for p in candidates if p.exists() and digest(p.read_bytes()) == source['sha256']), None)
        if data is None and source.get('gitBlob'):
            result = subprocess.run(['git', 'cat-file', 'blob', source['gitBlob']], cwd=ROOT, capture_output=True)
            if result.returncode == 0 and digest(result.stdout) == source['sha256']:
                data = result.stdout
        if data is None:
            with urllib.request.urlopen(source['url'], timeout=45) as response:
                data = response.read()
        if digest(data) != source['sha256']:
            raise ValueError(f'Original checksum mismatch: {id}')
        original.parent.mkdir(parents=True, exist_ok=True)
        original.write_bytes(data)
    if digest(data) != source['sha256']:
        raise ValueError(f'Sprite sheet changed: {id}; explicitly review/update its snapshot first.')
    return data


def decode(data):
    im = Image.open(io.BytesIO(data))
    frames, durations = [], []
    for i in range(getattr(im, 'n_frames', 1)):
        im.seek(i)
        rgba = im.convert('RGBA')
        rgb = Image.new('RGB', im.size, 'white')
        rgb.paste(rgba, mask=rgba.getchannel('A'))
        frames.append(rgb)
        durations.append(im.info.get('duration', 100))
    return frames, durations, im.info.get('loop')


def keyframes(data, source):
    if source['sourceId'] == 'custom':
        sheet = Image.open(io.BytesIO(data)).convert('RGB')
        w, h = sheet.size
        frames = [ImageOps.pad(sheet.crop((round(i % 4 * w / 4), round(i // 4 * h / 2), round((i % 4 + 1) * w / 4), round((i // 4 + 1) * h / 2))), (360, 360), color='white') for i in range(8)]
        return frames, [160] * 8, list(range(8))
    frames, durations, _ = decode(data)
    return frames, durations, list(range(len(frames)))


def phase_samples(frames):
    n = len(frames)
    # For sheets, phase by coarse foreground change instead of uneven panel
    # spacing. This also assigns little time to near-identical last/first poses.
    small = [np.asarray(im.resize((90, 90)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32) for im in frames]
    weights = [float(np.sqrt(np.mean((small[(i + 1) % n] - small[i]) ** 2))) for i in range(n)]
    weights = np.maximum(weights, max(weights) * .08)
    cumulative = np.concatenate(([0.], np.cumsum(weights)))
    samples = []
    for phase in np.arange(10) * cumulative[-1] / 10:
        i = min(n - 1, int(np.searchsorted(cumulative, phase, side='right') - 1))
        t = float((phase - cumulative[i]) / weights[i])
        samples.append((i, (i + 1) % n, t))
    return samples


def encode(frames, target, duration, pixel_exact=False):
    if pixel_exact:
        # Every original decoded image has <=256 colors. Per-frame palettes
        # preserve all source pixels, including existing source transition art.
        indexed = [frame.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for frame in frames]
    else:
        # Sheet interpolation creates new colors; use one stable palette and
        # no temporal dithering to avoid changing color speckles.
        strip = Image.new('RGB', (frames[0].width * len(frames), frames[0].height))
        for i, frame in enumerate(frames):
            strip.paste(frame, (i * frame.width, 0))
        palette = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    indexed[0].save(target, save_all=True, append_images=indexed[1:], duration=[duration] * len(frames), loop=0, disposal=2, optimize=False)
    decoded, durations, loop = decode(target.read_bytes())
    if len(decoded) != len(frames) or durations != [duration] * len(frames) or loop != 0:
        raise ValueError(f'GIF encoder changed frame count/timing: {target}')
    if pixel_exact and any(a.tobytes() != b.tobytes() for a, b in zip(frames, decoded)):
        raise ValueError(f'GIF encoder changed original source pixels: {target}')
    if any(a.tobytes() == b.tobytes() for a, b in zip(decoded, decoded[1:] + decoded[:1])):
        raise ValueError(f'GIF contains adjacent duplicate poses: {target}')
    return decoded, durations


def deduplicate_neighbors(frames):
    # Revisited poses on a return stroke must stay: removing nonadjacent
    # duplicates skips a necessary movement phase and changes the technique.
    kept = []
    indices = []
    for i, frame in enumerate(frames):
        if not kept or kept[-1].tobytes() != frame.tobytes():
            kept.append(frame)
            indices.append(i)
    if len(kept) > 1 and kept[0].tobytes() == kept[-1].tobytes():
        kept.pop()
        indices.pop()
    return kept, indices


def motion_metrics(frames):
    arrays = [np.asarray(im, dtype=np.int16) for im in frames]
    scores, changed = [], []
    for a, b in zip(arrays, arrays[1:] + arrays[:1]):
        diff = np.abs(a - b)
        active = np.min(a, axis=2) < 245
        active |= np.min(b, axis=2) < 245
        scores.append(round(float(diff[active].mean()), 4))
        changed.append(int(np.count_nonzero(np.max(diff, axis=2) > 3)))
    return {'foregroundMeanAbsoluteDifference': scores, 'changedPixelsOver3': changed,
            'seamToMaxStepRatio': round(scores[-1] / max(scores), 4),
            'uniqueDecodedPoses': len({digest(im.tobytes()) for im in frames})}


def save_strip(frames, path, durations):
    strip = Image.new('RGB', (180 * len(frames), 204), 'white')
    draw = ImageDraw.Draw(strip)
    for i, frame in enumerate(frames):
        strip.paste(frame.resize((180, 180)), (i * 180, 24))
        draw.text((i * 180 + 5, 5), f'{i}: {durations[i]}ms', fill='black')
    strip.save(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', help='Comma-separated IDs or @path/to/ids.json (list)')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--out-dir', type=Path, default=ROOT / 'public/anatomy')
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--snapshot', type=Path, default=ROOT / 'scripts/animation-originals.json')
    parser.add_argument('--cache-dir', type=Path, default=Path.home() / '.cache/makebody-animation')
    parser.add_argument('--originals-dir', type=Path)
    parser.add_argument('--review-dir', type=Path, help='Decoded strips and JSON motion report')
    args = parser.parse_args()
    entries = json.loads(args.snapshot.read_text())['entries']
    ids = list(entries)
    if args.ids:
        ids = json.loads(Path(args.ids[1:]).read_text()) if args.ids.startswith('@') else args.ids.split(',')
    if args.limit is not None:
        if args.limit < 1:
            parser.error('--limit must be positive')
        ids = ids[:args.limit]
    if not ids or any(id not in entries for id in ids):
        parser.error('IDs must belong to the explicit original-source snapshot')
    out = args.out_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = args.manifest or (ROOT / 'src/data/exercise-media.json' if out == (ROOT / 'public/anatomy').resolve() else out / 'exercise-media.json')
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    interpolator = FLOW.Interpolator(args.cache_dir / 'rife425-flownet.pkl')
    report = {}
    if args.review_dir:
        args.review_dir.mkdir(parents=True, exist_ok=True)
    # Cache all inputs first: even an interrupted rebuild can restart safely.
    originals = {id: read_original(id, entries[id], args.cache_dir, args.originals_dir) for id in ids}
    for id in ids:
        source = entries[id]
        poses, old_durations, _ = keyframes(originals[id], source)
        is_sheet = source['sourceId'] == 'custom'
        if is_sheet:
            samples = phase_samples(poses)
            frames = [interpolator.between(poses[a], poses[b], t) for a, b, t in samples]
            indices = None
            duration = 150
            mode = 'sheet-motion-interpolation'
        else:
            frames, indices = deduplicate_neighbors(poses)
            samples = []
            duration = 100 if len(poses) == 24 else 150
            mode = 'original-poses-even-cadence'
        decoded, durations = encode(frames, out / f'{id}.gif', duration, pixel_exact=not is_sheet)
        w, h = decoded[0].size
        columns = min(8, len(decoded))
        atlas = Image.new('RGB', (columns * w, math.ceil(len(decoded) / columns) * h), 'white')
        for i, frame in enumerate(decoded):
            atlas.paste(frame, (i % columns * w, i // columns * h))
        atlas.save(out / f'{id}-atlas.webp', lossless=True, method=6, exact=True)
        decoded[0].save(out / f'{id}-poster.webp', lossless=True, method=6, exact=True)
        manifest[id] = {'gif': f'anatomy/{id}.gif', 'atlas': f'anatomy/{id}-atlas.webp', 'poster': f'anatomy/{id}-poster.webp',
                        'width': w, 'height': h, 'columns': columns, 'frameCount': len(decoded), 'durations': durations,
                        'kind': 'illustrated-gif', 'sourceId': source['sourceId']}
        report[id] = {'cohort': source['cohort'], 'originalSha256': source['sha256'], 'sourceFrameCount': len(old_durations),
                      'sourceDurations': old_durations, 'preservedSourceFrameIndices': indices,
                      'processingMode': mode, 'originalPosesPixelExact': not is_sheet,
                      'outputFrameCount': len(decoded), 'outputDurations': durations,
                      'phaseSamples': [[a, b, round(t, 7)] for a, b, t in samples], **motion_metrics(decoded)}
        if args.review_dir:
            save_strip(decoded, args.review_dir / f'{id}-processed.png', durations)
            if id in ['bodyweight-squat', 'dumbbell-lateral-lunge', 'barbell-overhead-press', 'cable-triceps-pressdown']:
                original_frames = poses if source['sourceId'] == 'custom' else decode(originals[id])[0]
                save_strip(original_frames, args.review_dir / f'{id}-original.png', old_durations)
        interpolator.cache.clear()
        print(f'{id}: {len(old_durations)} -> {len(decoded)} frames, {sum(durations)}ms, seam/max={report[id]["seamToMaxStepRatio"]}', flush=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = manifest_path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(manifest, indent=2) + '\n')
    os.replace(temporary, manifest_path)
    if args.review_dir:
        (args.review_dir / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Built {len(ids)} animations; manifest: {manifest_path}')


if __name__ == '__main__':
    main()
