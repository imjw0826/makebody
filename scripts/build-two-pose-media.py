"""Export two held poses per exercise from the reviewed 720px artwork.

Always read the pinned Git snapshot so reruns cannot sample processed outputs.
No blending, interpolation or newly generated artwork is used.
"""
import hashlib
import io
import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = '083357f83cbd0f5e70f20852ff15037b3b4681a8'
HOLD_MS = 900


def original(file):
    return subprocess.check_output(['git', 'show', f'{SOURCE}:{file}'], cwd=ROOT)


manifest = json.loads(original('src/data/exercise-media.json'))
for id, entry in manifest.items():
    source = Image.open(io.BytesIO(original('public/' + entry['gif'])))
    # 24-frame sources contain four poses with six-frame transitions. Frame
    # 12 can repeat the starting pose; use the first movement's endpoint.
    indices = [0, 6 if source.n_frames == 24 else source.n_frames // 2]
    frames = []
    for index in indices:
        source.seek(index)
        frames.append(source.convert('RGB'))
    assert frames[0].tobytes() != frames[1].tobytes(), id
    # Individual palettes retain the already indexed source pixels exactly.
    indexed = [frame.quantize(colors=256, dither=Image.Dither.NONE) for frame in frames]
    output = ROOT / 'public' / entry['gif']
    indexed[0].save(output, save_all=True, append_images=indexed[1:],
                    duration=[HOLD_MS, HOLD_MS], loop=0, disposal=2, optimize=False)
    gif = Image.open(output)
    assert gif.n_frames == 2, id
    atlas = Image.new('RGB', (entry['width'] * 2, entry['height']), 'white')
    for index, expected in enumerate(frames):
        gif.seek(index)
        frame = gif.convert('RGB')
        assert frame.tobytes() == expected.tobytes(), (id, index)
        atlas.paste(frame, (index * entry['width'], 0))
        if index == 0:
            frame.save(ROOT / 'public' / entry['poster'], lossless=True, method=4)
    atlas.save(ROOT / 'public' / entry['atlas'], lossless=True, method=4)
    entry.update(columns=2, frameCount=2, durations=[HOLD_MS, HOLD_MS],
                 playbackMode='two-pose',
                 twoPoseSource={'commit': SOURCE, 'frameIndices': indices},
                 mediaRevision=hashlib.sha256(output.read_bytes()).hexdigest()[:16])

(ROOT / 'src/data/exercise-media.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Built {len(manifest)} two-pose GIFs, atlases and posters: {HOLD_MS}ms per pose, 720×720.')
