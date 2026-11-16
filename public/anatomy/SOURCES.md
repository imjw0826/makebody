# Anatomical exercise GIF sources

The active exercise library uses drawn grayscale anatomical figures with highlighted working muscles, never photographic demonstration images. All 119 exercises have a real multi-frame .gif file, a matching WebP frame atlas, and a static poster.

The active artwork and motion are restored from release `bdef819`. Those exact release GIFs are spatially upscaled from 360×360 to 720×720 with Lanczos resampling and mild sharpening. Frame counts, frame order and timing are retained. Input/output checksums and the source commit are recorded in the media manifest. See docs/IMAGE_RESOLUTION.md.

## Existing animation assets (105 exercises)

Asset host: https://github.com/omercotkd/exercises-gifs
Pinned commit: ebf642cd90fdf73a6c73e7127e93b607b12c229e
The host includes the MIT license (copied as LICENSE.txt) and credits the Kaggle Fitness Exercises with Animations dataset by edoardoba. The host states that rights remain with the original creators and dataset owner. We preserve that provenance and do not claim authorship of these drawings. Per-exercise source IDs are recorded in scripts/anatomy-sources.json.

## Custom animation sequences (14 exercises)

Anatomical pose sequences were generated using built-in ImageGen, then motion-warped into ten-frame sequences and encoded into animated GIFs using Pillow. Source sheets are in design/animation-sheets. These sequences are illustrated guidance, not motion capture. They may show less precise movement than the existing animation assets.

## Playback

The canvas player displays actual decoded GIF frames with their individual durations. Pause freezes the current pose; speed changes frame timing; the timeline seeks a real frame. The original 360px processing preserved numeric-source pixels and existing transition artwork with shorter, even delays. The current 720px release changes only spatial resolution and gentle sharpening. GIF download links return the matching larger animated file. Detailed native-resolution methods are documented in docs/ANIMATION_SMOOTHING.md.
