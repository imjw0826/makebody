> 보관 문서: 초기 SVG 도식 구현 기록입니다. 현재 화면은 실제 시범 사진과 AI 생성 정지 이미지로 교체되었습니다. 자세한 출처는 public/exercises/SOURCES.md를 확인하세요.

# Exercise animation: gray anatomy and red muscle regions

The user-supplied seated cable row reference at `/private/tmp/form-user-reference.webp` was inspected before this revision. Its shaded gray human, silver equipment, and red working regions informed the new code-native SVG treatment. The reference is not embedded, hotlinked, or distributed as an animation asset. This direction replaces the original chartreuse muscle palette; app navigation stays chartreuse.

## Implementation and API

`ExerciseAnimation.tsx` preserves the CONTRACT.md props and shared type imports. `playing` uses CSS animation play state, `speed` determines the real cycle duration (`4 / speed` seconds, finite values clamped to 0.1–4), `compact` adjusts sizing, and `className` passes through to the wrapper. Changes to playback do not rebuild the trajectories. Reduced-motion disables animation and displays the initial pose.

Each whole arm and leg now has one continuous Bezier skin contour over its shoulder/elbow/wrist or hip/knee/ankle chain. The contours animate using CSS SVG path interpolation, while local anatomical regions follow their bone transforms. This replaces the separate dark capsules and exposed joint discs. Neutral gray SVG gradients, a connected neck, shaped face, rounded pectoral/deltoid/biceps/triceps regions, broad dorsal patches, quadriceps, hamstrings, calves, and fine anatomical contour/fiber lines make the figure readable at the current stage size. These are simplified educational illustrations, without a medical-accuracy claim.

Primary regions use shaded red (legend swatch `#df483d`); secondary regions use pale salmon (`#f0afa1`). Inactive anatomy is muted gray. Broad back regions are visible for back exercises, rather than thin edge strips. `ExerciseDetail.tsx` changes are restricted to the two inline legend swatch styles. Global styles, app navigation, data, and feature folders are unchanged by this worker.

The rig still uses fixed-length two-bone inverse kinematics and deterministic 49-sample cycles, with unwrapped joint angles. Skin paths and bone transforms share the same CSS timeline, so pause freezes both. `useId` scopes gradients, title/description references, and keyframe names. No packages, runtime network calls, timers, raster images, or video assets were added.

## Motion and equipment coverage

All 14 movement IDs remain supported: press, curl, extension, pulldown, row, squat, hinge, lunge, plank, crunch, calf-raise, fly, pushup, and raise.

The seated cable-row profile uses a stable seated hip, only 10 degrees of controlled torso inclination, fixed feet on slanted foot supports, extended arms at the start, and flexed elbows bringing the close-grip handle to the lower torso at contraction. Its silver station includes guide rails, a cable route, low pulley, weight stack, floor frame, padded bench, and foot supports. The moving cable is calculated from the pulley to the actual IK wrist midpoint; the stack rises with the pull. Dumbbell and barbell rows retain their different bent-over, free-weight configurations. Machine rows use the seated profile and silver station.

Additional profiles distinguish pull-ups, machine chest presses, hamstring curls, bridges, bench versus overhead presses, face pulls, seated leg curls, leg extensions, standing cable flys, machine flys, and bent-over reverse flys. Generic cable curls, raises, and hinges use low-pulley cable routing; other generic standing cable work uses a high pulley. Cable endpoints follow actual wrists. Equipment silhouettes also cover dumbbells, barbells, kettlebells, flat benches, and pull-up bars.

## Verification

- Inspected both current data modules: 38 base and 69 extra exercises are wired into the app, for 107 total.
- Server-rendered all 107 exercises with finite geometry and 642 unique SVG/accessibility IDs.
- Full TypeScript project check and production Vite build passed after the final implementation: 1,611 modules transformed, JS bundle approximately 426 KB (124 KB gzip).
- Native Homebrew Node 24 and 26 aborted inside `node::modules::BindingData::ParsePackageJSON` before Vite startup; the installed TypeScript and Vite CLIs were successfully run with the already available Deno Node-compatibility runtime. No dependency or configuration change was made for this workaround.
- Final build command: `deno run --allow-all node_modules/typescript/lib/tsc.js -b && deno run --allow-all node_modules/vite/bin/vite.js build`; checked for concurrent builds before starting.
- Aside browser inspected the actual rendered app and production preview, including desktop 1440×1000 and mobile 390×844. The figure, station, and red/salmon legend remain visible inside the stage; no mobile horizontal overflow was observed.
- Actual app controls: paused skin/bone transforms remained unchanged across a timed sample; play advanced both the skin path and cable; selecting 2× by value produced a computed 2-second duration. Emulated reduced-motion returned `animation-name: none`.
- At the cable row start and contracted positions, the computed cable endpoint differed from the handle origin by less than 0.008 screen pixels. Feet were identical at both endpoints, the weight stack moved, and no exposed joint-disc nodes remained.
- Browser contact sheet also inspected cable, machine, dumbbell, and barbell row distinctions plus representative pulldown, squat, raise, pushup, plank, crunch, and bridge silhouettes.

Final production-preview screenshots (temporary local QA artifacts):

- `/private/tmp/form-animation-qa/desktop-row-start.png`
- `/private/tmp/form-animation-qa/desktop-row-end.png`
- `/private/tmp/form-animation-qa/mobile-row-start.png`
- `/private/tmp/form-animation-qa/mobile-row-end.png`
- Additional contact sheet: `/private/tmp/form-animation-qa/contact.png`

## Exact limits

These are deterministic two-dimensional exercise-family diagrams, not patient-specific biomechanics or detailed three-dimensional anatomy. Some named exercises still share family motion: unilateral versions, incline angles, machine-specific lever geometry, seated versus standing shoulder/calf variations, grip variants, pike/kneeling/incline pushups, hanging leg-raise variants, twists, bench dips, step-ups, and wall sits are not individually simulated. The machine-row drawing uses a cable-station mechanism rather than reproducing a particular lever machine. Front versus lateral raises share abduction geometry. Cable triceps variants share an overhead-family arm trajectory rather than reproducing every pressdown/kickback variation. The rendering does not show forearm rotation, scapular rotation in three dimensions, individual vertebrae, tendon mechanics, or resistance magnitude.

Continuous skin animation requires a browser supporting the SVG CSS `d: path(...)` property (verified in the current Aside Chromium browser). The initial SVG path remains a valid static fallback; older engines that cannot interpolate CSS paths may not animate the skin in synchrony with bone transforms. The separate list-card MuscleGlyph illustrations are outside this assignment and were not changed.
