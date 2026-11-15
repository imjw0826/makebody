# DATA_SOURCES_EXTRA — 추가 운동 라이브러리

대상 파일: `src/data/exercises.extra.ts` → `export const extraExercises: Exercise[]` (타입은 `./exercises`에서 import).

- 총 **69개** 운동. `src/data/exercises.ts`(작성 시점 38개)와 `id`, `englishName`, `name` 중복 없음(스크립트로 확인).
- 여러 근육이 주동근인 운동(예: 데드리프트, 스쿼트)은 아래 목록에서 해당 근육마다 한 번씩 나옵니다. 그래서 근육별 합계는 69보다 큽니다.

## 근육별 목록 (주동근 기준)

### 가슴 (chest) — 6개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `barbell-bench-press` | 바벨 벤치 프레스 | Barbell Bench Press | press | barbell + bench | intermediate |
| `incline-barbell-bench-press` | 인클라인 바벨 벤치 프레스 | Incline Barbell Bench Press | press | barbell + bench | intermediate |
| `cable-crossover` | 케이블 크로스오버 | Cable Crossover | fly | cable | intermediate |
| `pec-deck-fly` | 펙덱 플라이 | Pec Deck Fly | fly | machine | beginner |
| `incline-push-up` | 인클라인 푸시업 | Incline Push-up | pushup | bench | beginner |
| `decline-push-up` | 디클라인 푸시업 | Decline Push-up | pushup | bench | intermediate |

### 등 (back) — 9개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `lat-pulldown` | 랫 풀다운 | Lat Pulldown | pulldown | cable | beginner |
| `seated-cable-row` | 시티드 케이블 로우 | Seated Cable Row | row | cable | beginner |
| `barbell-bent-over-row` | 바벨 벤트오버 로우 | Barbell Bent-over Row | row | barbell | intermediate |
| `straight-arm-pulldown` | 스트레이트 암 풀다운 | Straight-arm Cable Pulldown | pulldown | cable | intermediate |
| `chest-supported-dumbbell-row` | 체스트 서포티드 덤벨 로우 | Chest-supported Dumbbell Row | row | dumbbell + bench | beginner |
| `seated-machine-row` | 시티드 로우 머신 | Seated Machine Row | row | machine | beginner |
| `assisted-pull-up` | 어시스트 풀업 | Machine-assisted Pull-up | pulldown | machine | beginner |
| `back-extension` | 백 익스텐션 | Back Extension | hinge | machine | beginner |
| `conventional-deadlift` | 컨벤셔널 데드리프트 | Conventional Barbell Deadlift | hinge | barbell | advanced |

### 어깨 (shoulders) — 9개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `barbell-overhead-press` | 바벨 오버헤드 프레스 | Standing Barbell Overhead Press | press | barbell | intermediate |
| `barbell-push-press` | 바벨 푸시 프레스 | Barbell Push Press | press | barbell | advanced |
| `arnold-press` | 아놀드 프레스 | Seated Arnold Press | press | dumbbell + bench | intermediate |
| `machine-shoulder-press` | 머신 숄더 프레스 | Machine Shoulder Press | press | machine | beginner |
| `cable-lateral-raise` | 케이블 레터럴 레이즈 | Single-arm Cable Lateral Raise | raise | cable | intermediate |
| `face-pull` | 페이스 풀 | Cable Face Pull | row | cable | beginner |
| `bent-over-dumbbell-reverse-fly` | 벤트오버 레터럴 레이즈 | Bent-over Dumbbell Reverse Fly | fly | dumbbell | intermediate |
| `reverse-pec-deck-fly` | 리버스 펙덱 플라이 | Reverse Pec Deck Fly | fly | machine | beginner |
| `pike-push-up` | 파이크 푸시업 | Pike Push-up | pushup | bodyweight | intermediate |

### 이두근 (biceps) — 5개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `barbell-curl` | 바벨 컬 | Barbell Curl | curl | barbell | beginner |
| `incline-dumbbell-curl` | 인클라인 덤벨 컬 | Incline Dumbbell Curl | curl | dumbbell + bench | intermediate |
| `cable-curl` | 케이블 컬 | Cable Biceps Curl | curl | cable | beginner |
| `concentration-curl` | 컨센트레이션 컬 | Dumbbell Concentration Curl | curl | dumbbell + bench | beginner |
| `cable-rope-hammer-curl` | 케이블 로프 해머 컬 | Cable Rope Hammer Curl | curl | cable | beginner |

### 삼두근 (triceps) — 5개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `close-grip-bench-press` | 클로즈 그립 벤치 프레스 | Close-grip Barbell Bench Press | press | barbell + bench | intermediate |
| `bench-dip` | 벤치 딥스 | Bench Dip | extension | bench | beginner |
| `diamond-push-up` | 다이아몬드 푸시업 | Diamond Push-up | pushup | bodyweight | intermediate |
| `cable-overhead-triceps-extension` | 케이블 오버헤드 트라이셉스 익스텐션 | Cable Overhead Triceps Extension | extension | cable | intermediate |
| `lying-dumbbell-triceps-extension` | 라잉 덤벨 트라이셉스 익스텐션 | Lying Dumbbell Triceps Extension | extension | dumbbell + bench | beginner |

### 복근 (abs) — 8개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `hanging-leg-raise` | 행잉 레그 레이즈 | Hanging Leg Raise | crunch | pullup-bar | advanced |
| `hanging-knee-raise` | 행잉 니 레이즈 | Hanging Knee Raise | crunch | pullup-bar | intermediate |
| `lying-leg-raise` | 레그 레이즈 | Lying Leg Raise | crunch | bodyweight | beginner |
| `bicycle-crunch` | 바이시클 크런치 | Bicycle Crunch | crunch | bodyweight | beginner |
| `side-plank` | 사이드 플랭크 | Side Plank | plank | bodyweight | intermediate |
| `cable-crunch` | 케이블 크런치 | Kneeling Cable Crunch | crunch | cable | intermediate |
| `kettlebell-russian-twist` | 케틀벨 러시안 트위스트 | Kettlebell Russian Twist | crunch | kettlebell | intermediate |
| `mountain-climber` | 마운틴 클라이머 | Mountain Climber | plank | bodyweight | intermediate |

### 대퇴사두근 (quads) — 12개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `barbell-back-squat` | 바벨 백 스쿼트 | Barbell Back Squat | squat | barbell | intermediate |
| `barbell-front-squat` | 바벨 프런트 스쿼트 | Barbell Front Squat | squat | barbell | advanced |
| `leg-press` | 레그 프레스 | Leg Press | squat | machine | beginner |
| `leg-extension` | 레그 익스텐션 | Leg Extension | extension | machine | beginner |
| `hack-squat` | 핵 스쿼트 | Machine Hack Squat | squat | machine | intermediate |
| `kettlebell-goblet-squat` | 케틀벨 고블릿 스쿼트 | Kettlebell Goblet Squat | squat | kettlebell | beginner |
| `reverse-lunge` | 리버스 런지 | Bodyweight Reverse Lunge | lunge | bodyweight | beginner |
| `dumbbell-walking-lunge` | 덤벨 워킹 런지 | Dumbbell Walking Lunge | lunge | dumbbell | intermediate |
| `dumbbell-step-up` | 덤벨 스텝업 | Dumbbell Step-up | lunge | dumbbell + bench | intermediate |
| `wall-sit` | 월 싯 | Wall Sit | squat | bodyweight | beginner |
| `dumbbell-sumo-squat` | 덤벨 스모 스쿼트 | Dumbbell Sumo Squat | squat | dumbbell | beginner |
| `curtsy-lunge` | 커트시 런지 | Bodyweight Curtsy Lunge | lunge | bodyweight | intermediate |

### 햄스트링 (hamstrings) — 8개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `conventional-deadlift` | 컨벤셔널 데드리프트 | Conventional Barbell Deadlift | hinge | barbell | advanced |
| `barbell-romanian-deadlift` | 바벨 루마니안 데드리프트 | Barbell Romanian Deadlift | hinge | barbell | intermediate |
| `dumbbell-romanian-deadlift` | 덤벨 루마니안 데드리프트 | Dumbbell Romanian Deadlift | hinge | dumbbell | beginner |
| `seated-leg-curl` | 시티드 레그 컬 | Machine Seated Leg Curl | curl | machine | beginner |
| `good-morning` | 바벨 굿모닝 | Barbell Good Morning | hinge | barbell | advanced |
| `kettlebell-swing` | 케틀벨 스윙 | Kettlebell Swing | hinge | kettlebell | intermediate |
| `cable-pull-through` | 케이블 풀스루 | Cable Pull-through | hinge | cable | beginner |
| `sumo-deadlift` | 스모 데드리프트 | Barbell Sumo Deadlift | hinge | barbell | advanced |

### 둔근 (glutes) — 17개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `conventional-deadlift` | 컨벤셔널 데드리프트 | Conventional Barbell Deadlift | hinge | barbell | advanced |
| `barbell-back-squat` | 바벨 백 스쿼트 | Barbell Back Squat | squat | barbell | intermediate |
| `leg-press` | 레그 프레스 | Leg Press | squat | machine | beginner |
| `kettlebell-goblet-squat` | 케틀벨 고블릿 스쿼트 | Kettlebell Goblet Squat | squat | kettlebell | beginner |
| `reverse-lunge` | 리버스 런지 | Bodyweight Reverse Lunge | lunge | bodyweight | beginner |
| `dumbbell-walking-lunge` | 덤벨 워킹 런지 | Dumbbell Walking Lunge | lunge | dumbbell | intermediate |
| `dumbbell-step-up` | 덤벨 스텝업 | Dumbbell Step-up | lunge | dumbbell + bench | intermediate |
| `barbell-romanian-deadlift` | 바벨 루마니안 데드리프트 | Barbell Romanian Deadlift | hinge | barbell | intermediate |
| `dumbbell-romanian-deadlift` | 덤벨 루마니안 데드리프트 | Dumbbell Romanian Deadlift | hinge | dumbbell | beginner |
| `good-morning` | 바벨 굿모닝 | Barbell Good Morning | hinge | barbell | advanced |
| `kettlebell-swing` | 케틀벨 스윙 | Kettlebell Swing | hinge | kettlebell | intermediate |
| `barbell-hip-thrust` | 바벨 힙 스러스트 | Barbell Hip Thrust | hinge | barbell + bench | intermediate |
| `cable-pull-through` | 케이블 풀스루 | Cable Pull-through | hinge | cable | beginner |
| `sumo-deadlift` | 스모 데드리프트 | Barbell Sumo Deadlift | hinge | barbell | advanced |
| `single-leg-glute-bridge` | 싱글 레그 글루트 브리지 | Single-leg Glute Bridge | hinge | bodyweight | intermediate |
| `dumbbell-sumo-squat` | 덤벨 스모 스쿼트 | Dumbbell Sumo Squat | squat | dumbbell | beginner |
| `curtsy-lunge` | 커트시 런지 | Bodyweight Curtsy Lunge | lunge | bodyweight | intermediate |

### 종아리 (calves) — 6개

| id | 이름 | English | movement | equipment | 난이도 |
|---|---|---|---|---|---|
| `standing-calf-raise` | 스탠딩 카프 레이즈 | Bodyweight Standing Calf Raise | calf-raise | bodyweight | beginner |
| `single-leg-calf-raise` | 싱글 레그 카프 레이즈 | Single-leg Calf Raise | calf-raise | bodyweight | intermediate |
| `dumbbell-calf-raise` | 덤벨 카프 레이즈 | Dumbbell Standing Calf Raise | calf-raise | dumbbell | beginner |
| `barbell-calf-raise` | 바벨 카프 레이즈 | Barbell Standing Calf Raise | calf-raise | barbell | intermediate |
| `seated-calf-raise` | 시티드 카프 레이즈 | Machine Seated Calf Raise | calf-raise | machine | beginner |
| `standing-machine-calf-raise` | 스탠딩 카프 레이즈 머신 | Machine Standing Calf Raise | calf-raise | machine | beginner |

## 집계

| 구분 | 개수 |
|---|---|
| 주동근 | chest 6 · back 9 · shoulders 9 · biceps 5 · triceps 5 · abs 8 · quads 12 · hamstrings 8 · glutes 17 · calves 6 |
| 기구 | bodyweight 12 · dumbbell 11 · barbell 15 · bench 13 · cable 11 · machine 12 · pullup-bar 2 · kettlebell 3 |
| 동작 | squat 7 · hinge 10 · press 7 · row 5 · curl 6 · extension 4 · raise 1 · pulldown 3 · pushup 4 · lunge 4 · plank 2 · crunch 6 · calf-raise 6 · fly 4 |
| 난이도 | beginner 32 · intermediate 31 · advanced 6 |

## 편집 규칙과 판단이 들어간 부분

- **equipment**: 필요한 기구를 모두 나열했습니다. 맨몸 운동은 `['bodyweight']`만 씁니다. 벤치에 손이나 발을 올리는 맨몸 운동(인클라인/디클라인 푸시업, 벤치 딥스)은 `['bench']`입니다.
- **랙·세이프티 바**: EquipmentId에 랙이 없어 바벨 스쿼트·벤치 프레스 등은 `barbell`(+`bench`)만 표기했습니다. 안전장치 사용은 팁으로 안내합니다.
- **랫 풀다운, 시티드 케이블 로우**: 케이블 스테이션에서 하는 운동이라 `cable`로 분류했습니다. 기존 `cable-triceps-pressdown`과 같은 기준입니다.
- **백 익스텐션**: 로만 체어(하이퍼익스텐션 벤치)는 일반 벤치로 대체할 수 없어 `machine`으로 분류했습니다.
- **movement는 가장 가까운 값**을 골랐습니다. 딱 맞는 값이 없던 운동:
  - 벤치 딥스 → `extension` (팔꿈치를 펴는 삼두 동작)
  - 행잉 레그/니 레이즈, 레그 레이즈, 러시안 트위스트 → `crunch` (몸통 굴곡·회전 계열)
  - 마운틴 클라이머 → `plank` (플랭크 자세 기반)
  - 월 싯, 레그 프레스, 핵 스쿼트 → `squat`
  - 페이스 풀 → `row`, 어시스트 풀업·스트레이트 암 풀다운 → `pulldown`
  - 스텝업, 커트시 런지 → `lunge`
  - 힙 스러스트, 글루트 브리지, 백 익스텐션, 케틀벨 스윙, 풀스루 → `hinge`
- **근육 태그**: MuscleId에 없는 근육은 가장 가까운 항목으로 묶었습니다. 승모근·척추기립근·능형근은 `back`, 후면 삼각근은 `shoulders`, 상완근·전완근은 따로 표기하지 않았습니다. 내전근과 고관절 굴곡근은 대응 항목이 없어 생략했습니다.
- **시간 유지 운동**: `side-plank`, `wall-sit`은 `defaultReps`에 **초**를 넣고(30) 팁에 명시했습니다. 기존 `front-plank`는 "1회 = 20초" 방식(`defaultReps: 1`)이라 표기 방식이 다릅니다.
- **좌우 교대/한쪽 운동**: 횟수 기준(좌우 합계 또는 한쪽 기준)을 팁에 적었습니다.

## 참고한 일반 자료

특정 문서를 인용하지 않았고 URL도 적지 않았습니다. 운동 구성, 근육 분류, 자세 설명은 아래와 같은 널리 알려진 자료에 공통으로 실린 내용을 바탕으로 직접 작성했습니다.

- NSCA, *Essentials of Strength Training and Conditioning* — 주요 저항 운동의 자세와 보조 지침
- ACE(American Council on Exercise) 운동 라이브러리 — 운동별 주동근 분류와 단계별 설명 방식
- ExRx.net 운동 디렉터리 — 운동별 주동근·협력근 분류
- Frédéric Delavier, *Strength Training Anatomy* — 운동별 근육 해부도
- 국내 헬스장과 생활스포츠지도사 교육에서 통용되는 운동 명칭 — 한국어 이름 표기

수치(세트·횟수)는 일반적인 근비대·근지구력 권장 범위를 따른 기본값이며, 개인 처방이 아닙니다.
