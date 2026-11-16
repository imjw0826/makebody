# Continuous anatomical animation sources

Active animations use illustrated gray anatomical figures with red working muscles. All119 exercises are48-frame looping GIFs at40ms/frame (25fps). GIF and canvas playback use identical decoded frames.

## Authored intermediate poses

105 exercises: twelve genuinely different joint poses per exercise, generated using built-in ImageGen on November16,2026. Source files: design/motion-sheets/*.png, four columns by three rows. The exact exercise name, primary muscles, equipment and Korean technique were supplied in each prompt.

14 exercises: existing eight-pose ImageGen illustrations in design/animation-sheets/*.png. These already contain actual intermediate positions rather than two-pose dissolves.

The pose intervals are spatially motion-interpolated to48 frames. No new alpha crossfade is used, and the previous two-pose GIFs are not used as motion input. See docs/CONTINUOUS_MOTION.md and IMAGE_PROMPTS.md for methods, reproducible build steps and limits. The RIFE inference architecture/weights retain the license in scripts/animation-RIFE-LICENSE.txt.

## Historical catalogue provenance

The previous asset host was https://github.com/omercotkd/exercises-gifs, pinned commit ebf642cd90fdf73a6c73e7127e93b607b12c229e. Its license remains in LICENSE.txt and the original exercise-ID mapping is retained for catalogue history. The host credited the Kaggle Fitness Exercises with Animations dataset by edoardoba and disclaimed ownership. The active rendered art has now been replaced by authored pose sheets; no Hevy, StrengthLog or JEFIT media is used. Research for the extra12 exercises is documented in EXERCISE_ADDITIONS.md.
