# Active continuous-motion pose prompts

Built-in ImageGen mode, November16,2026. Final 105 twelve-pose sheets: `design/motion-sheets/*.png`; the earlier14 eight-pose sheets remain in `design/animation-sheets/*.png`. Final animated GIF assets are encoded with48 frames per exercise.

New shared prompt: exactly4 columns by3 rows, twelve equal square cells, overall4:3, no gutter/separators/text. Same fixed orthographic side/three-quarter camera, same adult male anatomical drawing, consistent scale/body proportions/face/equipment/floor baseline. Grayscale finely drawn anatomical muscle fibers, black shorts, RED working muscles, white background; never a skin-color photo. One full repetition left-to-right/top-to-bottom: start, progressive genuine intermediate joint angles, contraction, progressive return, almost start. Every consecutive cell advances the correct moving joints. Never alternate two poses, never crossfade transparent figures. Full body and required equipment remain visible in every cell. Supply each exercise's exact English/Korean name, primary muscles, equipment, original instructions and tips. Keep grip, posture, machine lever connections and cable routing correct. No logos/watermarks.

The cable-pushdown pilot additionally specified elbow angles90→105→120→140→160→175 degrees, then return, with upper arms fixed beside torso and a taut cable to the high pulley.

Each atlas is converted into48 interpolated motion frames using the current motion builder. Prompt outputs are source poses, not complete UI screenshots.

---

Earlier eight-pose sheet prompt record:

# Anatomical animation sprite prompts

Active assets: `public/anatomy/*.gif`; original ImageGen sheets: `design/animation-sheets/*.png`. Built-in ImageGen mode, November 15, 2026. Previous skin-tone still illustrations have been superseded.

Shared prompt: exactly four columns and two rows of eight equally sized square cells, edge-to-edge, no gutters, no labels. Identical camera, scale, equipment and white background in all frames. Grayscale anatomical male illustration with muscle fibers, black shorts and RED main working muscles; never photographic skin. Frames 1–4 show a controlled movement from start to contraction; frames 5–8 return. Stable floor baseline and full visible body. Isometric plank/wall sit retain correct pose with subtle breathing. Each exercise supplies its English name and available Korean technique instructions. The eight cells are encoded as a genuine looping GIF using Pillow.

Exercise prompts:
- bodyweight-squat: Bodyweight Squat
- dumbbell-front-squat: Dumbbell Front Squat
- dumbbell-lateral-lunge: Dumbbell Lateral Lunge
- dumbbell-hip-thrust: Bench Dumbbell Hip Thrust
- front-plank: Front Plank
- barbell-push-press: Barbell Push Press
- pike-push-up: Pike Push-up
- hanging-knee-raise: Hanging Knee Raise
- kettlebell-russian-twist: Kettlebell Russian Twist
- reverse-lunge: Bodyweight Reverse Lunge
- dumbbell-walking-lunge: Dumbbell Walking Lunge
- wall-sit: Wall Sit
- barbell-hip-thrust: Barbell Hip Thrust
- dumbbell-sumo-squat: Dumbbell Sumo Squat
