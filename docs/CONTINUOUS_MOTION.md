# Continuous anatomical motion

The production library replaces two-pose/crossfade source GIFs with real authored intermediate joint poses. Simply retiming twelve crossfaded frames did not create motion; that earlier approach has been superseded.

## Active assets

- All 119 exercises are exported as **48 distinct timeline frames**, 40ms each (25fps), with one full looping repetition in1.92seconds.
- 105 exercises have a new twelve-pose illustrated sequence in `design/motion-sheets/<id>.png`: four columns by three rows, one fixed-camera complete movement cycle. Each exercise prompt supplies its exact technique/equipment and asks for visibly advancing joint positions.
- 14 exercises reuse their eight genuinely different anatomical key poses from `design/animation-sheets/`.
- Each interval is spatially motion-interpolated using RIFE correspondence and a single warped endpoint. The builder does not alpha-crossfade two transparent bodies and never uses the old two-pose GIFs as motion inputs.
- The final GIF, lossless WebP atlas and poster share exactly the same decoded frames. Pause/seek/speed operate on these real frames.

This is illustrated guidance, not motion capture. Generation and interpolation can retain small differences in proportions or equipment details. Plank/wall sit keep an isometric hold and only subtle breathing variation; they should not turn into a dynamic exercise.

## Build and validation

Use the isolated environment/dependency setup described in the earlier `ANIMATION_SMOOTHING.md` dependency section. Then run:

```sh
/private/tmp/makebody-animation-venv/bin/python scripts/build-motion.py --cache-dir /private/tmp/makebody-animation-cache
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run check:media
/private/tmp/makebody-animation-venv/bin/python scripts/verify-animation.py --report /private/tmp/makebody-continuous-verification.json
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build
```

The normal builder fails if an authored sheet is missing. `--ready-only --skip-built` is an explicitly partial development workflow, never the completion criterion. `sheetSha256` in the manifest detects changed inputs and prevents stale exports. Generated sheets are committed in the project; no image generation API key or model call is needed to rebuild an existing sheet.

The older numeric source IDs and original-source hashes are retained as catalogue research/history, not the active motion art. Do not restore old two-pose GIFs over the new exports.

## Completed verification

All119 GIFs decode to48 unique frames:5,712 frames in total. Encoded delays are40ms and loop metadata is infinite. Every decoded GIF frame exactly matches its lossless atlas tile, and every poster matches the first frame. No neighboring frames, including the loop seam, are duplicates. Source-sheet SHA hashes match the committed inputs. The atlas cell rules are removed from a four-pixel exterior rim without changing pose geometry.

Aside browser QA at1536×1024 and390×844 confirmed max frame47 for new/corrected exercise examples, running frames21→30→38→47, pixel-identical pause, seek to actual frame24,2× speed, GIF download returning image/gif/GIF89a, no relevant console errors and no horizontal mobile overflow. Asset URLs contain the source hash, frame count, delay and render revision to prevent previously cached two-pose media from being reused. All105 new pose sequences and the14 existing pose sequences were reviewed as contact strips; priority cable pushdown and dumbbell lunge were also reviewed across their decoded48-frame sequences.
