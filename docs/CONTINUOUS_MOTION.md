# Fixed-model anatomical animation

The active 119 animations use one CC0 MakeHuman hm08 human mesh, a fixed rest shape, fixed skin weights, and deterministic joint trajectories rendered with Blender 5.3 Workbench. Every animation contains 60 explicitly rendered frames at 40ms per frame (25fps), a 2.4-second loop. There is no image interpolation, optical flow, alpha fading, per-frame image generation, or changing muscle texture.

`design/animation-sheets` and `design/motion-sheets` retain historical artwork only. They are not inputs to the active renderer. The former RIFE path produced unstable anatomy and equipment and has been retired.

## Structure

- `scripts/rig/model.py`: shared mesh, fixed muscle vertex colors, volume-preserving skinning, fixed segment lengths and two-bone IK. A complete-trajectory preflight chooses one constant roll reference per segment, avoiding the 180-degree surface flips caused by a forearm crossing a fixed world axis. A separate pelvis allows controlled torso rotation.
- `scripts/rig/motion.py`: exercise-specific joint trajectories, grips, supports, cable paths, fixed machine pivots and equipment attachment constraints. Free weights follow the same grip coordinates as the hands; cable endpoints use the actual grip/ankle position.
- `scripts/rig/exercises.json`: the 119 exercise records used for rendering, checked against the UI catalogue.
- `scripts/rig/assets`: vendored CC0 mesh, young male and muscle shape targets, joint definitions and weights. Original copyright notices are preserved. Upstream: https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data
- `scripts/rig/render.py`: fixed camera/material rendering, a shared palette for the full cycle, GIF/atlas/poster encoding and joint reports.
- `design/rig-reports`: every rendered joint position, segment-length error, loop seam displacement and machine lever length variation.

Geometry of frames is continuous, while the visual style is an educational 3D anatomical illustration. Machines are simplified motion-graphics models. They illustrate their contact and motion constraints rather than reproducing a particular manufacturer's machine. Static holds intentionally retain the same posture; frame count is not inflated by pretending a hold is a repetition.

## Rebuild

Python 3.13 and an OS supported by the pinned `bpy` wheel are required. On Apple Silicon, macOS 13+ is supported.

```sh
python3.13 -m venv /private/tmp/makebody-rig-venv
/private/tmp/makebody-rig-venv/bin/pip install -r scripts/animation-requirements.txt
/private/tmp/makebody-rig-venv/bin/python scripts/setup-animation.py
/private/tmp/makebody-rig-venv/bin/python scripts/build-anatomy.py
```

Use `--ids cable-triceps-pressdown` for one exercise, `--preview --out /private/tmp/rig-review` for four-pose strips, or `--audit` for all joint trajectories without image rendering. No model API, secret key or image downloads are needed after dependencies are installed. The manifest includes a SHA-256 of the vendored source and rendering code; media URLs include that hash and render revision to invalidate old cached GIFs.

## Validation

```sh
npm run check:media
/private/tmp/makebody-rig-venv/bin/python scripts/verify-animation.py --report /private/tmp/makebody-rig-verification.json
npm run build
```

Checks decode every GIF and verify its 60 image descriptors, 40ms delays, infinite loop, dimensions and pixel-exact agreement with every atlas tile and poster. Rig reports verify constant segment lengths, fixed-length machine linkages, bone rotation continuity (including axial roll), and continuity across the loop seam. Browser QA checks real playback, pause, frame seeking, speed, GIF download and mobile overflow. Visual review remains necessary for posture and equipment placement; a frame-count check alone cannot establish animation quality.

## Verified export

All 119 animations / 7,140 decoded GIF frames passed both validators and the production build. Maximum segment-length error was 0.000000167m and machine lever length variation was 0.000000153m (floating-point precision). Maximum bone rotation between adjacent frames, including the seam, was 12.09 degrees; the roll-reference preflight removed the forearm flips found during review.

Aside browser QA at 1536×1024 and 390×844 confirmed the 60-frame timeline, advancing frames 26→32→38→45, pixel-identical pause, seek to frame 30, 2× speed selection, versioned GIF downloads with GIF89a bytes, no horizontal mobile overflow and no console errors. Equipment, bench/floor contacts and muscle placement were reviewed in pose strips; final decoded examples were also checked against the rendered page. Static holds remain intentional holds.
