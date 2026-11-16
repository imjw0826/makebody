# Exercise additions — 2026-11-16

Integration note: hashes and decoded timing below describe the downloaded source originals. Final public exports have subsequently been retimed by the safe animation pipeline; the original hashes remain pinned in scripts/animation-originals.json. See docs/ANIMATION_SMOOTHING.md for the delivered timing and frame-count policy.

Added **12** exercises to `extraExercises`: **107 → 119 unique exercises**. No UI, filter schema, existing exercise, existing media, animation pipeline or media manifest was edited by this worker. Korean guidance is original concise writing; website instructions were used to verify setup and mechanics, not copied as a translation. Defaults are editable starting values, not a prescribed training plan.

## Research and missing-before comparison

Research date: **2026-11-16 (Asia/Seoul)**. Used direct **Aside REPL**, after reading `aside guide` and `aside guide repl`; no delegated Aside agent or helper worker. `snapshot()` was the primary page-reading method. The live [makebody catalogue](https://imjw0826.github.io/makebody/) showed **107 exercises**, the default grid and 1/9 pagination. Its source arrays were compared against `git show HEAD:src/data/exercises.ts` plus `git show HEAD:src/data/exercises.extra.ts`; all 107 preexisting records remain byte-equivalent as parsed objects. None of the 12 new IDs, Korean names or English names existed before.

Primary workout-logging libraries inspected: [Hevy Exercise Library](https://www.hevyapp.com/exercises/), [StrengthLog Exercise Directory](https://www.strengthlog.com/exercise-directory/), and [JEFIT Reverse Crunch](https://www.jefit.com/exercises/338/reverse-crunch). Hevy pages were discovered through its homepage “Exercise Library” link, pagination and Abdominals category; StrengthLog pages through its homepage “Exercise Directory” link and exact exercise links. JEFIT’s exact page was discovered with Aside’s `google-search` helper, then opened and read directly. Individual research pages are linked below.

[Strong](https://www.strong.app/) and its [Exercises help category](https://help.strongapp.io/category/96-exercises) were also inspected. That public category describes management of exercises rather than a browseable exercise catalogue, so it was not used to claim that a specific exercise is in Strong. StrengthLog and JEFIT supply the additional primary library evidence.

| Added ID / Korean / English | Direct research page | Actual gap versus the old 107 |
| --- | --- | --- |
| `assisted-chest-dip` / 머신 어시스티드 체스트 딥 / Machine-assisted Chest Dip | [Exercise guide](https://www.strengthlog.com/assisted-dips/) | 기존 bench-dip은 벤치 뒤로 손을 짚는 동작이며 무릎 패드 보조 머신 딥이 없었음. |
| `dumbbell-shrug` / 덤벨 슈러그 / Dumbbell Shrug | [Exercise guide](https://www.strengthlog.com/dumbbell-shrug/) | 기존 로우·풀다운과 달리 팔을 편 채 견갑골을 거상하는 슈러그가 없었음. |
| `barbell-upright-row` / 바벨 업라이트 로우 / Barbell Upright Row | [Exercise guide](https://www.strengthlog.com/barbell-upright-row/) | 기존 barbell-bent-over-row는 숙인 자세의 수평 당기기이며 선 자세의 업라이트 로우가 없었음. |
| `barbell-reverse-curl` / 바벨 리버스 컬 / Barbell Reverse Curl | [Exercise guide](https://www.strengthlog.com/reverse-barbell-curl/) | 기존 barbell-curl은 손바닥을 위로 잡으며, 회내 그립 리버스 컬은 없었음. |
| `dead-bug` / 데드 버그 / Dead Bug | [Exercise guide](https://www.strengthlog.com/dead-bugs/) | 기존 front-plank와 달리 바로 누워 반대쪽 팔·다리를 움직이는 몸통 안정화 운동이 없었음. |
| `machine-hip-abduction` / 머신 시티드 힙 어브덕션 / Machine Seated Hip Abduction | [Exercise guide](https://www.strengthlog.com/hip-abduction-machine/) | 기존 브리지·힙 스러스트는 고관절 신전이며 앉아서 벌리는 외전 머신 운동이 없었음. |
| `heel-taps` / 누워서 힐 터치 / Alternating Heel Taps | [Exercise guide](https://www.hevyapp.com/exercises/heel-taps/) | 기존 bicycle-crunch는 몸통 회전이며 좌우 측굴로 뒤꿈치를 짚는 힐 터치는 없었음. |
| `sit-up` / 팔짱 싯업 / Arms-crossed Sit-up | [Exercise guide](https://www.strengthlog.com/sit-up/) | 기존 crunch는 견갑골만 드는 짧은 몸통 굴곡이며 상체를 더 일으키는 싯업이 없었음. |
| `dumbbell-pullover` / 벤치 덤벨 풀오버 / Bench Dumbbell Pullover | [Exercise guide](https://www.strengthlog.com/dumbbell-pullover/) | 기존 dumbbell-fly는 팔을 옆으로 벌리며 머리 뒤로 중량을 보내는 풀오버가 없었음. |
| `dumbbell-zottman-curl` / 덤벨 조트맨 컬 / Dumbbell Zottman Curl | [Exercise guide](https://www.strengthlog.com/zottman-curl/) | 기존 hammer-curl은 중립 그립을 유지하며 올림·내림의 그립을 바꾸는 조트맨 컬이 없었음. |
| `cable-glute-kickback` / 스탠딩 케이블 글루트 킥백 / Standing Cable Glute Kickback | [Exercise guide](https://www.strengthlog.com/cable-glute-kickback/) | 기존 dumbbell-triceps-kickback은 팔꿈치 신전이며 발목 케이블로 다리를 뒤로 뻗는 운동이 없었음. |
| `reverse-crunch` / 리버스 크런치 / Reverse Crunch | [Exercise guide](https://www.jefit.com/exercises/338/reverse-crunch) | 기존 lying-leg-raise는 편 다리를 올리며 무릎을 굽힌 상태에서 골반을 말아 드는 리버스 크런치가 없었음. |

## Schema and editorial choices

- Existing `MuscleId`, `EquipmentId` and `MovementId` unions are unchanged. Upper trapezius maps to the existing aggregate `back`; gluteus medius/maximus hip abduction maps to `glutes`; obliques map to `abs`. Forearm work in reverse/Zottman curls is acknowledged here but not falsely mapped to a different muscle ID. Their valid primary muscle is `biceps`. No nonexistent `forearms`, `traps`, `adductors` or `abductors` IDs were added.
- `equipment` contains every required category: the pullover requires both `dumbbell` and `bench`; assisted dip/hip abduction use `machine` (including integral handles, seats and pads). The cable kickback needs a low cable with an **ankle strap**, explicitly stated in its instructions/tip; normal cable attachments remain part of the existing `cable` category.
- Closest existing movements are used: dead bug → `plank` (anti-extension stability), shrug/hip abduction → `raise`, upright row → `row`, pullover → `pulldown`, hip kickback → `extension`. These are broad metadata classifications; the exact animation is keyed by the new exercise ID/source map.
- All 12 are dynamic repetition exercises, **not timed holds**. Dead bug, heel taps and cable kickbacks use repetitions **per side** and explicitly require both sides to finish a set. All defaults are 3 sets; repetitions are 8–15 as stored in the data.
- Ab wheel was excluded because the schema has no wheel category; ordinary parallel-bar dips require equipment that cannot truthfully be represented as always-available bodyweight, so the assisted dip machine variant was selected. Wrist curls and hip adduction were excluded because their primary muscles lack suitable IDs. Bird dog was not selected without an exact verified asset.

## Pinned anatomical media provenance

Source repository: [omercotkd/exercises-gifs, pinned commit ebf642cd90fdf73a6c73e7127e93b607b12c229e](https://github.com/omercotkd/exercises-gifs/tree/ebf642cd90fdf73a6c73e7127e93b607b12c229e). Each new GIF is an unchanged byte-for-byte download from `assets/<sourceID>.gif` at that commit, renamed only to the new exercise ID. Exact original links and SHA-256 hashes below retain provenance. `scripts/anatomy-sources.json` maps each new ID to its source numeric ID.

The [pinned exercises.csv](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/exercises.csv) was downloaded anew and matched `/private/tmp/makebody-gifs.csv` byte-for-byte. CSV SHA-256: `ab3aadadfd55bb09483922efa769f6b0e5ea217c6b405033f4c40ceb3ab079dc`.

The host repository publishes an [MIT license](https://github.com/omercotkd/exercises-gifs/blob/ebf642cd90fdf73a6c73e7127e93b607b12c229e/LICENSE), already retained locally at `public/anatomy/LICENSE.txt`. Its [README](https://github.com/omercotkd/exercises-gifs/blob/ebf642cd90fdf73a6c73e7127e93b607b12c229e/README.md) identifies it as a backup of the [Fitness Exercises with Animations Kaggle dataset](https://www.kaggle.com/datasets/edoardoba/fitness-exercises-with-animations/data) and disclaims ownership of the content. This report records that limitation and does **not** claim the host owns or independently cleared the original illustrations. Existing attribution/license files were preserved. No Hevy, StrengthLog or JEFIT media is redistributed.

| New exercise ID | Exact source ID / CSV name | CSV equipment → app equipment | Frames / distinct decoded frames |
| --- | --- | --- | --- |
| `assisted-chest-dip` | [0009](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0009.gif) / assisted chest dip (kneeling) | leverage machine → machine | 12 / 10 |
| `dumbbell-shrug` | [0406](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0406.gif) / dumbbell shrug | dumbbell → dumbbell | 12 / 10 |
| `barbell-upright-row` | [0121](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0121.gif) / barbell upright row v. 3 | barbell → barbell | 12 / 10 |
| `barbell-reverse-curl` | [0080](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0080.gif) / barbell reverse curl | barbell → barbell | 12 / 10 |
| `dead-bug` | [0276](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0276.gif) / dead bug | body weight → bodyweight | 12 / 10 |
| `machine-hip-abduction` | [0597](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0597.gif) / lever seated hip abduction | leverage machine → machine | 12 / 10 |
| `heel-taps` | [0006](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0006.gif) / alternate heel touchers | body weight → bodyweight | 12 / 10 |
| `sit-up` | [3679](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/3679.gif) / sit-up with arms on chest | body weight → bodyweight | 12 / 10 |
| `dumbbell-pullover` | [0375](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0375.gif) / dumbbell pullover | dumbbell → dumbbell, bench | 12 / 10 |
| `dumbbell-zottman-curl` | [0439](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0439.gif) / dumbbell zottman curl | dumbbell → dumbbell | 24 / 24 |
| `cable-glute-kickback` | [0228](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0228.gif) / cable standing hip extension | cable → cable | 12 / 10 |
| `reverse-crunch` | [0872](https://raw.githubusercontent.com/omercotkd/exercises-gifs/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets/0872.gif) / reverse crunch | body weight → bodyweight | 12 / 10 |

## Visual inspection and decoding evidence

Every GIF was decoded with Pillow, not judged from its filename. All are **360 × 360**, with **12 frames / 10 distinct decoded RGB frames** except Zottman curl (**24 / 24**). All contain red muscle-highlight pixels and real changes in limb or equipment position. Contact sheets were generated from decoded source frames at indices 0, 4 and 8 (Zottman 0, 8, 16), then visually inspected with the image viewer. Upright-row alternatives 0119/0121/0123 were additionally inspected at frames 0 and 6; the selected 0121 shows a straight bar. Hip abduction was also inspected at full resolution at frame 6. No photographic demonstration imagery was used.

Temporary inspection artifacts (not required at runtime): `/private/tmp/exercise-additions-review/review-0.jpg`, `review-1.jpg`, `upright-review.jpg`, `abduction.png`, `validation.json`. The durable observations are:

- **`assisted-chest-dip`:** Knees rest on moving assistance pad; both hands on machine dip handles; elbows bend as body/pad descend. Chest, triceps and front shoulder highlights.
- **`dumbbell-shrug`:** Standing with one dumbbell at each side; elbows stay extended while shoulders elevate. Upper trapezius highlight.
- **`barbell-upright-row`:** Standing, pronated close grip on a straight bar; elbows lift laterally as bar rises. Deltoid/upper-back highlights. Rejected source 0120 because its bar is curved (EZ bar); selected straight-bar source 0121.
- **`barbell-reverse-curl`:** Standing with straight bar, palms down throughout; elbow flexion/extension, with upper-arm and forearm highlights. Distinct from supinated barbell curl.
- **`dead-bug`:** Supine, bent knees above hips, opposite arm and leg extend toward floor while other limbs remain raised. Abdominal highlight.
- **`machine-hip-abduction`:** Seated with back support and pads outside knees; thighs spread and return, machine linkage/stack moves. Subtle outer-hip highlights; this is abduction, not inward adduction.
- **`heel-taps`:** Supine, knees bent and feet on floor; raised shoulders side-bend to alternate hands toward heels. Abdominal/oblique highlights.
- **`sit-up`:** Supine to sitting trunk flexion with knees bent, feet on floor and arms crossed at chest. Abdominal highlight. Full sit-up rather than the existing short crunch.
- **`dumbbell-pullover`:** Lying lengthwise on flat bench, feet on floor; one dumbbell held with both hands moves in an arc behind head and back above chest. Chest/upper-trunk highlights.
- **`dumbbell-zottman-curl`:** Standing bilateral dumbbells; palms-up curl followed by forearm rotation at top and palms-down lowering. Upper-arm and forearm highlights; rotation verified across 24 frames.
- **`cable-glute-kickback`:** Standing facing support, ankle attached to low cable; working leg extends behind body while support leg stays planted. Glute and hamstring highlights.
- **`reverse-crunch`:** Supine, knees bent above hips; pelvis rolls off floor as knees travel toward torso, then returns. Abdominal highlight. Distinct from straight-leg lying raise.

### Exact downloaded file hashes

| File | SHA-256 |
| --- | --- |
| `public/anatomy/assisted-chest-dip.gif` | `b51bdbefa7795340b7e3ff9ad643b88b882a62920fd36e508eb72dfca4880916` |
| `public/anatomy/dumbbell-shrug.gif` | `82c7b6f33d244700c0490ff6e1ba6527ea88eb93869ca4aff5489e7803ea8702` |
| `public/anatomy/barbell-upright-row.gif` | `894b04ca98c742b9aecd17ee991c1d2f5acf3a1a358ddc457c081596f5dde042` |
| `public/anatomy/barbell-reverse-curl.gif` | `71bc39ece615675c421f85a5e4ffd8a113e393754cb22289e02a41378682e5b8` |
| `public/anatomy/dead-bug.gif` | `e928dd260751357f9048c069a64b3076d6e53e4011b4ac6cc719e9da676d2b96` |
| `public/anatomy/machine-hip-abduction.gif` | `5fbd0a7cd8f6cf7b9948b66818554c13ad32f011197acf2445ad6b55b837d3c8` |
| `public/anatomy/heel-taps.gif` | `56202ab0f540f9e5eb51c22a31f8ca590c75cb78f87a32b12a59d81be326186e` |
| `public/anatomy/sit-up.gif` | `3fb8cf8c68b143276845072c2121be83f76a9985487c213dca869fb8f649289d` |
| `public/anatomy/dumbbell-pullover.gif` | `ce8214c2c989513f631df1761d4a6a494c588dedcafab47bb47099db435c8fcd` |
| `public/anatomy/dumbbell-zottman-curl.gif` | `679dcd8bd4146d9ac48582ebcd85095a34a099278adc16a1b55a438df5f06f05` |
| `public/anatomy/cable-glute-kickback.gif` | `af49591c8676a3a8a69be2355bad5231e138e203bca8364c3793abfa5e4d20dd` |
| `public/anatomy/reverse-crunch.gif` | `368bcfd87bd09fe9d199db15aa7d63c551e7bb18d4cbbc6a566c3509cdd0419a` |

## Validation and integration handoff

- **PASS:** Node 24 + TypeScript transpilation checked both source arrays against HEAD: original 107 parsed records unchanged; exactly 12 additions; **119** unique IDs, Korean names and English names. All muscle, equipment, movement, difficulty, guidance and default numeric fields validated against the existing schema. Each new entry has a four-digit source map value and an existing GIF.
- **PASS:** Every new GIF fully decoded; multiple distinct poses, expected equipment, relevant muscle area and visible red highlights verified as described above.
- **PASS:** `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` (`tsc -b && vite build`) on 2026-11-16. No full media rebuild was run.
- **Required coordinator integration:** After the separate animation-pipeline worker finishes, rebuild the atlases/posters and `src/data/exercise-media.json` once using that worker’s final pipeline, then run the media checker and browser QA for the combined change. The new source GIFs are ready; their manifest entries/derived media are intentionally left for that shared rebuild. Build success here proves typing/bundling, not post-rebuild browser playback.
- **Owned changed files only:** `src/data/exercises.extra.ts`, `scripts/anatomy-sources.json`, this report, and the 12 new `public/anatomy/<new-id>.gif` files listed above. No commit or push was made.

## Resolved integration issue — recording units (2026-11-16)

Final Aside QA exposed a real integration bug: `movement: 'plank'` was treated as a 20-second counted hold in the workout form, so the dynamic dead bug showed `유지 횟수 (20초)`. Movement describes the exercise mechanics and is no longer used to choose recording units. The original addition-stage statement that existing records were unchanged above describes that stage; this follow-up adds measurement metadata to front/side plank without changing their defaults or any saved record values.

**Resolved:** `Exercise` now has optional, typed `measurement` metadata: `repetitions` (also the default when omitted), or a counted `hold` with `secondsPerRep`. Dead bug explicitly declares repetitions and keeps its existing anti-extension `plank` movement classification. Front and side plank explicitly retain the existing **20 seconds per counted hold** behavior. Both `WorkoutForm` and `WorkoutHistory` use the same small `exerciseMeasurement` helper for labels, count suffixes and guidance. There is no exercise-ID exception or movement-based unit inference. Dynamic mountain climbers, which also use the plank movement pattern, consequently receive repetition labels as intended.

History now resolves exercises from both base and extra data via a shared module-level lookup, so extra exercises' measurement metadata is available there too. The `WorkoutRecord` shape, local-storage key, validator, numeric defaults, sets/reps/weight values and existing saved records remain unchanged; no migration or conversion is performed. This change preserves side plank's existing counted-hold UI convention; it does not reinterpret older numeric records as durations.

Validation:

- **PASS — focused React rendering checks (Node 24):** actual form/history markup for dead bug, front plank, side plank, mountain climber and push-up; dead bug and mountain climber use repetitions, both planks use 20-second counted holds. Existing record objects remain valid and byte-equivalent after rendering. All 119 catalogue entries are retained. A 45-second metadata fixture confirms the shared formatter reads the duration instead of hardcoding 20; unknown exercises retain a plain repetition suffix.
- **PASS — direct Aside browser QA:** `http://localhost:5173/makebody/` → search/select dead bug → form shows `반복 횟수`, default **8**, and no 20-second hold guidance; search/select front plank → form shows `유지 횟수 (20초)`, default **1**, and `1회 = 20초 유지입니다`. Browser evidence: `/private/tmp/makebody-measurement-aside-qa.txt`; focused render-check evidence: `/private/tmp/makebody-measurement-validation.txt`.
- **PASS:** `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build` and `git diff --check`. React review: derived labels are computed directly, existing hooks/form associations remain intact, history lookup is built once, and no new dependency or state effect is introduced.
- Follow-up changed files: `src/data/exercises.ts`, `src/data/exercises.extra.ts`, `src/data/exercise-measurement.ts`, `src/components/WorkoutForm.tsx`, `src/components/WorkoutHistory.tsx`, and this report. No animation assets, source maps, pipelines or media manifests were edited in this fix. The coordinator has already rebuilt all 119 animations; **deployment remains with the coordinator**, and no commit/push was made by this worker.
