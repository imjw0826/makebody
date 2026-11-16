> Historical record only. Active animations now use a single fixed 3D anatomical rig, with 60 rendered frames. See [CONTINUOUS_MOTION.md](CONTINUOUS_MOTION.md) for current build and validation commands. The old RIFE dependency/setup and build commands below are retired.

# Animation processing and quality limits

## Delivered result

The safe build covers **119 exercises**: the original **107**, plus **12** additions. Downloadable GIFs and canvas playback assets use the same decoded export frames.

| Source group | Assets | Before | Delivered | Improvement |
| --- | ---: | --- | --- | --- |
| Original sprite sheets | 14 | 8 × 160 ms = 1.28 s | **10 × 150 ms = 1.50 s** | New motion-warped poses and better phase distribution |
| Numeric source GIFs | 100 | 12 frames / 3 s, with 1 s holds | **12 × 150 ms = 1.80 s** | Every original pose/pixel retained; long freezes replaced by even cadence |
| Numeric multi-phase GIFs | 5 | 24 frames / 5 s, with 0.5–1 s holds | **24 × 100 ms = 2.40 s** | Every original phase/pixel retained, with even cadence |

Actual total: **1,460 decoded frames**. All GIFs loop indefinitely (`loop=0`). No duplicate frames are inserted, and no new alpha crossfades are generated.

**Exactly ten timeline frames is secondary to preserving anatomy and movement phases.** Each of the 100 twelve-frame originals already has ten distinct RGB images. Repeated images occur on different outward/return strokes, not next to one another or at duplicate loop endpoints. Removing them would skip movement phases. Four 24-frame sources have 24 distinct images; one has 21. The adjacent/loop-end deduplicator safely removes **zero** frames from the pinned numeric originals.

The 14 sheet IDs are `bodyweight-squat`, `dumbbell-front-squat`, `dumbbell-lateral-lunge`, `dumbbell-hip-thrust`, `front-plank`, `barbell-push-press`, `pike-push-up`, `hanging-knee-raise`, `kettlebell-russian-twist`, `reverse-lunge`, `dumbbell-walking-lunge`, `wall-sit`, `barbell-hip-thrust`, and `dumbbell-sumo-squat`.

## Method and limits

Sheet animation samples ten uniformly timed phases around the whole cycle. Phase distance uses coarse image change between neighboring panels, including the last-to-first transition; nearly identical endpoints receive little phase time. Fractional phases use RIFE 4.25 correspondence estimation and **spatial warping of one endpoint drawing**. Stock RIFE's final alpha mixture is omitted: the nearer endpoint's warped image supplies all pixels. This creates intermediate poses without superimposing transparent bodies. Gray shading and red muscle colors come from the drawing.

The numeric GIFs already contain crossfaded transition artwork. **That artwork is retained unchanged**: it is not newly recovered anatomical motion. Their improvement is timing regularity. All **1,320 numeric source poses** are independently verified pixel for pixel and in sequence after encoding. No synthesis or additional ghosting is introduced to them.

An attempt to synthesize all numeric sequences from their held poses was rejected during visual review: large pose gaps distorted heads, limbs and equipment. Those outputs have been replaced. The production builder has **no numeric synthesis path**.

This remains low-frame-rate illustrated guidance, not continuous-motion video or a medically/biomechanically precise model. Interpolation cannot correct inconsistent proportions, faces or equipment already present in the sheets. Plank/wall-sit sheets preserve their supplied subtle variations. The 1.5/1.8/2.4 s loops are illustration cadence, not prescribed training tempo.

## Reproducible inputs

`scripts/animation-originals.json` freezes all **119 IDs**, SHA-256 hashes, source IDs and `existing107` / `added12` cohorts independently of the live catalogue/source map.

- The 14 PNGs come from `design/animation-sheets/` and must match their pinned hashes.
- All 105 numeric originals are cached by SHA-256 **before** output writes. An existing processed GIF is ignored unless it matches the original hash, preventing repeated lossy resampling.
- Missing originals can be recovered from pinned Git blob IDs, then exact upstream URLs at commit `ebf642cd90fdf73a6c73e7127e93b607b12c229e`. Downloaded bytes must match their SHA-256 hashes. This also supports fresh/shallow clones.
- `--originals-dir` optionally supplies original `<exercise-id>.gif` files with the same checks.
- Review and explicitly update the snapshot when adding exercises or changing sheets; a later download cannot silently enter a rebuild. Addition provenance remains in `EXERCISE_ADDITIONS.md`.

## Dependencies and exact commands

Run from `exercise-lab`. Dependencies live in an isolated Python 3.13 environment, with no app npm changes. `scripts/animation-requirements.txt` pins Pillow 12.2.0, NumPy 2.4.3, PyTorch 2.10.0 and gdown 5.2.0. CPU inference uses deterministic algorithms and four threads.

```sh
/opt/homebrew/bin/python3.13 -m venv /private/tmp/makebody-animation-venv
/private/tmp/makebody-animation-venv/bin/pip install -r scripts/animation-requirements.txt
/private/tmp/makebody-animation-venv/bin/python scripts/setup-animation.py --cache-dir /private/tmp/makebody-animation-cache
```

Setup downloads the fixed upstream RIFE 4.25 bundle, verifies hardcoded SHA-256 hashes for archive and weights, and extracts only the weights outside the repository. The compact inference architecture is adapted from that model bundle; its MIT notice is retained in `scripts/animation-RIFE-LICENSE.txt`. PyTorch loads weights with `weights_only=True`. Initial model/missing-original downloads need network access; repeat builds can run from cache.

Full production rebuild and checks:

```sh
/private/tmp/makebody-animation-venv/bin/python scripts/build-anatomy.py --cache-dir /private/tmp/makebody-animation-cache --review-dir /private/tmp/makebody-animation-safe-proof
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run check:media
/private/tmp/makebody-animation-venv/bin/python scripts/verify-animation.py --original-cache-dir /private/tmp/makebody-animation-cache/originals --report /private/tmp/makebody-animation-safe-proof/pixel-verification.json
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build
```

Use Node 24 on this machine; installed Node 26 aborts. Run production media writes serially. Selected entries merge into the manifest without deleting unrelated entries.

Isolated four-example build, touching neither live media nor the app manifest:

```sh
/private/tmp/makebody-animation-venv/bin/python scripts/build-anatomy.py --ids bodyweight-squat,dumbbell-lateral-lunge,barbell-overhead-press,cable-triceps-pressdown --cache-dir /private/tmp/makebody-animation-cache --out-dir /private/tmp/makebody-animation-preview --review-dir /private/tmp/makebody-animation-preview-proof
PATH=/opt/homebrew/opt/node@24/bin:$PATH node scripts/check-media.mjs --manifest /private/tmp/makebody-animation-preview/exercise-media.json --media-dir /private/tmp/makebody-animation-preview --ids bodyweight-squat,dumbbell-lateral-lunge,barbell-overhead-press,cable-triceps-pressdown
/private/tmp/makebody-animation-venv/bin/python scripts/verify-animation.py --manifest /private/tmp/makebody-animation-preview/exercise-media.json --media-dir /private/tmp/makebody-animation-preview
```

`--ids @/path/ids.json` accepts an explicit JSON list of snapshot IDs. `--limit N` permits smoke builds. `--manifest` overrides the manifest path. An isolated `--out-dir` defaults to a manifest inside that directory; production defaults to `src/data/exercise-media.json`.

## Encoding and evidence

Numeric frames use individual GIF palettes and must decode pixel-exactly to their source sequence or the build aborts. Sheet frames use one shared 256-color palette without dithering to avoid temporal speckles. GIFs have explicit delays, full-frame disposal and infinite looping. The builder decodes each saved GIF before creating **lossless** WebP atlas/poster assets, so the canvas and download display identical RGB pixels.

`check-media.mjs` parses actual GIF image descriptors, encoded delays and loop metadata, checks the manifest, and reads actual WebP dimensions. Reviewed frame counts are 10/12/24. `verify-animation.py` independently decodes every frame, compares atlas tiles/posters byte for byte, checks neighboring movement including the seam, and optionally verifies numeric originals against the hash-pinned cache. `--review-dir` generates decoded strips and JSON timing/phase/difference metrics.

Validation completed on 2026-11-16:

- **119 GIFs / 1,460 frames**: 14 × 10, 100 × 12, 5 × 24; actual decoded delays are 150 ms for 10/12-frame animations and 100 ms for 24-frame animations.
- Every frame matches its atlas tile and every poster matches frame zero. All **1,320 numeric poses** match original pixels and sequence order.
- No identical adjacent frames, including wraparound. The smallest transition changes **2,364 pixels** by more than 3 RGB levels. Revisiting a pose later in a cycle is preserved deliberately.
- Across all 119 exports, foreground mean absolute difference at the seam is **0.5682–1.0000 ×** the animation's largest ordinary frame step. This detects exceptional seam jumps, not anatomical correctness.
- Priority seam/max ratios: squat **0.8119**, lateral lunge **0.7415**, overhead press **0.9765**, cable pushdown **0.9757**. Press/pushdown retain their original 12-frame/10-distinct-pose drawings; their cadence changes.
- All 14 sheet contact strips were visually inspected. The squat descends/returns, lunge shifts sideways/returns, push press retains dip/drive/return, and other sheets retain their supplied sequence. Press/pushdown source and processed strips were inspected; their pixels remain identical.
- A second build of the four priority examples, after processed outputs existed, produced **12/12 byte-identical GIF/atlas/poster files** from originals.
- Direct Aside REPL native-GIF check: plain `<img>` elements loaded all four 360 × 360 GIFs and produced changing rendered image hashes over 2.6 s. The background browser surface throttled painting; this proves native load/animation behavior, not precise timing. Encoded timing/counts were checked by decoding.
- `npm run check:media` and TypeScript/Vite production build passed with Node 24. `ExerciseAnimation.tsx` is unchanged. Final app pause/seek/speed QA remains the coordinator's integration step.

Review artifacts: `/private/tmp/makebody-animation-safe-proof/` contains `report.json`, `pixel-verification.json`, priority before/after strips and `sheets-0.png` / `sheets-1.png`. These temporary files are not runtime dependencies. Safe media and the manifest are already rebuilt in the checkout. The coordinator can proceed to final app/browser QA and deployment without another rebuild unless making further changes.

## Coordinator integration QA

Direct Aside app checks at 1536×1024 and 390×844 confirmed the 119-item catalogue, search/select for new dead bug and Zottman curl, changing rendered animation frames, pixel-identical pause snapshots, seeking to frame six, and actual 2× speed selection. The ten-frame squat reports max frame nine, while the multi-phase Zottman illustration retains max frame23. GIF download returns HTTP200, image/gif and GIF89a. No relevant browser console errors or mobile horizontal overflow were observed. The discovered dead-bug hold/repetition integration issue was fixed and independently verified by the library worker; details are in EXERCISE_ADDITIONS.md. Existing records require no migration.
