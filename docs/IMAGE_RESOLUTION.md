# Restored release and larger images

The app and artwork are restored from `bdef819`, two published revisions before the rejected 3D replacement. The 48-frame authored-pose revision and the 3D rig revision are removed from the active project. The current recreation experiment was stopped and is not included.

All 119 exercise GIFs, playback atlases and posters are now 720 × 720 per frame, up from 360 × 360. This is a spatial 2× upscale (4× pixels). FFmpeg uses Lanczos scaling and mild sharpening. No new drawings, poses, frame interpolation, timing changes or AI image synthesis are applied. Original source resolution limits remain; this does not invent additional anatomical detail.

The exact GIFs from the pinned release are the inputs. Each manifest entry records its source commit, original GIF checksum and output revision. Canvas, poster and download URLs include the revision to replace cached rejected images.

```sh
# Requires FFmpeg and Python with Pillow/NumPy.
python scripts/upscale-media.py
npm run check:media
python scripts/verify-animation.py
python scripts/verify-resolution.py
npm run build
```

The validators check actual GIF dimensions, frame count, encoded delays and loop metadata; exact GIF/atlas/poster pixels; output revision hashes; and agreement with every corresponding source frame from `bdef819` after reducing the larger output to the original size. The library retains its 119 exercises, grid/list browsing, filters, routine and workout record views.
