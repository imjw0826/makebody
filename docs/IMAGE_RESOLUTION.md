# Two-pose playback and larger images

As of 2026-11-17, all 119 exercises use exactly two held poses, alternating every 900ms with no blending or intermediate frames. GIF downloads, canvas atlases and posters use the same artwork. `scripts/build-two-pose-media.py` reads the pinned 720px Git snapshot `083357f` and records selected frame indices in `twoPoseSource`. The usual source poses are frames 0 and the midpoint. Four-pose, 24-frame sources use frames 0 and 6, because their midpoint can repeat the starting pose. Rebuilds always read the pinned inputs, never a previous two-pose export.

The app and artwork are restored from `bdef819`, two published revisions before the rejected 3D replacement. The 48-frame authored-pose revision and the 3D rig revision are removed from the active project. The current recreation experiment was stopped and is not included.

All 119 exercise GIFs, playback atlases and posters are 720 × 720 per frame, up from 360 × 360. The original upscale used FFmpeg Lanczos scaling and mild sharpening. The two-pose export preserves those pixels exactly, selects two existing poses and changes only the frame sequence and hold duration. Original source resolution limits remain; this does not invent additional anatomical detail.

The exact GIFs from the pinned release are the inputs. Each manifest entry records its source commit, original GIF checksum and output revision. Canvas, poster and download URLs include the revision to replace cached rejected images.

```sh
# Requires Python with Pillow/NumPy. The older upscale-media.py and
# build-anatomy.py are historical pipelines; they restore multi-frame playback.
python scripts/build-two-pose-media.py
npm run check:media
python scripts/verify-animation.py
python scripts/verify-resolution.py
npm run build
```

The validators check exactly two GIF frames, 900ms holds and loop metadata; exact GIF/atlas/poster pixels; output revision hashes; and agreement with the selected source frames from `bdef819` after reducing the larger output to the original size. The library retains its 119 exercises, grid/list browsing, filters, routine and workout record views.
