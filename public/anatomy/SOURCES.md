# Anatomical exercise GIF sources

The active exercise library uses drawn grayscale anatomical figures with highlighted working muscles, never photographic demonstration images. All 107 exercises have a real multi-frame .gif file, a matching WebP frame atlas, and a static poster.

## Existing animation assets (93 exercises)

Asset host: https://github.com/omercotkd/exercises-gifs
Pinned commit: ebf642cd90fdf73a6c73e7127e93b607b12c229e
The host includes the MIT license (copied as LICENSE.txt) and credits the Kaggle Fitness Exercises with Animations dataset by edoardoba. The host states that rights remain with the original creators and dataset owner. We preserve that provenance and do not claim authorship of these drawings. Per-exercise source IDs are recorded in scripts/anatomy-sources.json.

## Custom animation sequences (14 exercises)

Anatomical pose sequences were generated using built-in ImageGen, then encoded into animated GIFs using Pillow. Source sheets are in design/animation-sheets. These sequences are illustrated guidance, not motion capture. They may show less precise movement than the existing animation assets.

## Playback

The canvas player displays actual decoded GIF frames with their individual durations. Pause freezes the current pose; speed changes frame timing; the timeline seeks a real frame. No crossfade or fabricated CSS motion is used. GIF download links return the original animated file.
