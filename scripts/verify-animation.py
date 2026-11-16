"""Decode exports and prove exact GIF/atlas/poster agreement and moving seams."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--manifest', type=Path, default=Path('src/data/exercise-media.json'))
parser.add_argument('--media-dir', type=Path, default=None)
parser.add_argument('--ids', help='Comma-separated subset')
parser.add_argument('--report', type=Path)
parser.add_argument('--original-cache-dir', type=Path, help='Also prove every numeric source pose is unchanged; points to cache/originals')
parser.add_argument('--snapshot', type=Path, default=Path('scripts/animation-originals.json'))
args = parser.parse_args()
manifest = json.loads(args.manifest.read_text())
ids = args.ids.split(',') if args.ids else list(manifest)
report = {}
snapshot = json.loads(args.snapshot.read_text())['entries'] if args.original_cache_dir else None
original_pose_total = 0
for id in ids:
    entry = manifest[id]
    gif = Image.open(args.media_dir / Path(entry['gif']).name if args.media_dir else Path('public') / entry['gif'])
    atlas = Image.open(args.media_dir / Path(entry['atlas']).name if args.media_dir else Path('public') / entry['atlas']).convert('RGB')
    poster = Image.open(args.media_dir / Path(entry['poster']).name if args.media_dir else Path('public') / entry['poster']).convert('RGB')
    assert gif.n_frames == entry['frameCount'] and gif.n_frames == 48, id
    assert gif.info.get('loop') == 0, id
    assert entry.get('sourceId') == 'authored-motion' and entry.get('keyPoseCount') in [8, 12], (id, 'missing authored intermediate poses')
    pose_dir = 'design/animation-sheets' if entry['keyPoseCount'] == 8 else 'design/motion-sheets'
    pose_file = Path(pose_dir) / (id + '.png')
    assert hashlib.sha256(pose_file.read_bytes()).hexdigest() == entry['sheetSha256'], (id, 'pose input changed')

    frames, hashes, delays = [], [], []
    for i in range(gif.n_frames):
        gif.seek(i)
        rgb = gif.convert('RGB')
        tile = atlas.crop((i % entry['columns'] * entry['width'], i // entry['columns'] * entry['height'], (i % entry['columns'] + 1) * entry['width'], (i // entry['columns'] + 1) * entry['height']))
        assert rgb.tobytes() == tile.tobytes(), (id, 'atlas', i)
        if i == 0:
            assert rgb.tobytes() == poster.tobytes(), (id, 'poster')
        frames.append(np.asarray(rgb, dtype=np.int16))
        hashes.append(hashlib.sha256(rgb.tobytes()).hexdigest())
        delays.append(gif.info['duration'])
    assert delays == entry['durations'] and len(set(delays)) == 1, id
    changed = [int(np.count_nonzero(np.max(np.abs(a - b), axis=2) > 3)) for a, b in zip(frames, frames[1:] + frames[:1])]
    assert min(changed) > 0, (id, 'nonmoving transition')
    assert all(a != b for a, b in zip(hashes, hashes[1:] + hashes[:1])), (id, 'duplicate')
    # Out/back loops naturally revisit the same spatial pose; this is
    # different from inserting adjacent duplicate frames to inflate counts.
    report[id] = {'decodedFrames': gif.n_frames, 'uniquePoses': len(set(hashes)), 'durations': delays,
                  'changedPixelsOver3IncludingSeam': changed, 'pixelExactAtlasAndPoster': True}
    if snapshot and entry.get('sourceId') != 'authored-motion' and snapshot[id]['sourceId'] != 'custom':
        original = args.original_cache_dir / (snapshot[id]['sha256'] + '.gif')
        assert hashlib.sha256(original.read_bytes()).hexdigest() == snapshot[id]['sha256'], id
        source = Image.open(original)
        source_hashes = []
        for i in range(source.n_frames):
            source.seek(i)
            value = hashlib.sha256(source.convert('RGB').tobytes()).hexdigest()
            if not source_hashes or value != source_hashes[-1]:
                source_hashes.append(value)
        if len(source_hashes) > 1 and source_hashes[-1] == source_hashes[0]:
            source_hashes.pop()
        assert hashes == source_hashes, (id, 'numeric original pose changed')
        report[id]['pixelExactOriginalPoseSequence'] = True
        original_pose_total += len(source_hashes)

if args.report:
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
print(f'Pixel-verified {len(ids)} GIFs / {sum(v['decodedFrames'] for v in report.values())} frames: exact atlases/posters, timing, loop=0, no adjacent duplicate poses.')
print(f'Minimum changed pixels per transition (including seams): {min(min(v["changedPixelsOver3IncludingSeam"]) for v in report.values())}')

if snapshot:
    print(f'Proved {original_pose_total} numeric original poses preserved pixel for pixel and in order.')
