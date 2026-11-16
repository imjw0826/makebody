# Active animation sources

All 119 GIFs are rendered from a single fixed, skinned anatomical model with Blender 5.3. Each contains 60 frames at 40ms (25fps), a 2.4-second loop. GIF, atlas and poster use identical decoded pixels.

The human mesh (hm08), shape targets, rig joints and skin weights come from MakeHuman Community's CC0 data collection: https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data . Copyright notices and full CC0 terms are preserved in scripts/rig/assets/ and LICENSE.txt.

The fixed muscle coloring, motion trajectories and simplified equipment are authored in scripts/rig/. Prior AI pose sheets and RIFE warping are historical work and are no longer motion inputs. See docs/CONTINUOUS_MOTION.md for reproducible commands, constraints and validation.
