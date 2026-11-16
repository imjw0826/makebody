// Curated exercise data. Source mapping and editorial conventions: ../../DATA_SOURCES.md
export type MuscleId = 'chest'|'back'|'shoulders'|'biceps'|'triceps'|'abs'|'quads'|'hamstrings'|'glutes'|'calves';
export type EquipmentId = 'bodyweight'|'dumbbell'|'barbell'|'bench'|'cable'|'machine'|'pullup-bar'|'kettlebell';
export type MovementId = 'squat'|'hinge'|'press'|'row'|'curl'|'extension'|'raise'|'pulldown'|'pushup'|'lunge'|'plank'|'crunch'|'calf-raise'|'fly';
// Recording units are independent of movement patterns. Omitted means repetitions;
// a counted hold keeps the existing records' reps value and declares its duration.
export type ExerciseMeasurement = { kind:'repetitions' } | { kind:'hold'; secondsPerRep:number };
export interface Exercise { id:string; name:string; englishName:string; primaryMuscles:MuscleId[]; secondaryMuscles:MuscleId[]; equipment:EquipmentId[]; difficulty:'beginner'|'intermediate'|'advanced'; movement:MovementId; measurement?:ExerciseMeasurement; instructions:string[]; tips:string[]; defaultSets:number; defaultReps:number; }

export const muscles: {id:MuscleId;name:string;englishName:string}[] = [
  {
    "id": "chest",
    "name": "가슴",
    "englishName": "Chest"
  },
  {
    "id": "back",
    "name": "등",
    "englishName": "Back"
  },
  {
    "id": "shoulders",
    "name": "어깨",
    "englishName": "Shoulders"
  },
  {
    "id": "biceps",
    "name": "이두근",
    "englishName": "Biceps"
  },
  {
    "id": "triceps",
    "name": "삼두근",
    "englishName": "Triceps"
  },
  {
    "id": "abs",
    "name": "복근",
    "englishName": "Abdominals"
  },
  {
    "id": "quads",
    "name": "대퇴사두근",
    "englishName": "Quadriceps"
  },
  {
    "id": "hamstrings",
    "name": "햄스트링",
    "englishName": "Hamstrings"
  },
  {
    "id": "glutes",
    "name": "둔근",
    "englishName": "Glutes"
  },
  {
    "id": "calves",
    "name": "종아리",
    "englishName": "Calves"
  }
];

export const equipment: {id:EquipmentId;name:string}[] = [
  {
    "id": "bodyweight",
    "name": "맨몸"
  },
  {
    "id": "dumbbell",
    "name": "덤벨"
  },
  {
    "id": "barbell",
    "name": "바벨"
  },
  {
    "id": "bench",
    "name": "벤치"
  },
  {
    "id": "cable",
    "name": "케이블"
  },
  {
    "id": "machine",
    "name": "머신"
  },
  {
    "id": "pullup-bar",
    "name": "철봉"
  },
  {
    "id": "kettlebell",
    "name": "케틀벨"
  }
];

// Every equipment entry is required; built-in machine seats/pads are included in machine.
export const exercises: Exercise[] = [
  {
    "id": "push-up",
    "name": "푸시업",
    "englishName": "Push-up",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "shoulders",
      "abs"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "intermediate",
    "movement": "pushup",
    "instructions": [
      "손을 어깨보다 약간 넓게 바닥에 놓고 두 발을 뒤로 뻗습니다.",
      "배에 힘을 주어 머리부터 발뒤꿈치까지 일직선을 만듭니다.",
      "팔꿈치를 굽혀 가슴을 바닥 쪽으로 내립니다.",
      "바닥을 밀어 팔을 펴고 시작 자세로 돌아옵니다."
    ],
    "tips": [
      "허리가 아래로 처지지 않게 유지하세요.",
      "고개를 내밀지 말고 바닥을 바라보세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "knee-push-up",
    "name": "무릎 푸시업",
    "englishName": "Bent-knee Push-up",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "shoulders",
      "abs"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "beginner",
    "movement": "pushup",
    "instructions": [
      "손을 어깨보다 약간 넓게 놓고 무릎을 바닥에 댑니다.",
      "무릎부터 머리까지 몸통을 곧게 유지합니다.",
      "팔꿈치를 굽혀 가슴을 천천히 바닥 쪽으로 내립니다.",
      "손바닥으로 바닥을 밀어 시작 자세로 돌아옵니다."
    ],
    "tips": [
      "엉덩이만 뒤로 빼지 마세요.",
      "가슴과 골반이 함께 움직이게 하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "dumbbell-chest-press",
    "name": "덤벨 벤치 프레스",
    "englishName": "Dumbbell Chest Press",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "press",
    "instructions": [
      "덤벨을 들고 평평한 벤치에 누워 발을 바닥에 둡니다.",
      "팔꿈치를 굽혀 덤벨을 가슴 양옆에 놓습니다.",
      "숨을 내쉬며 덤벨을 가슴 위로 밀어 올립니다.",
      "팔꿈치를 천천히 굽혀 시작 위치로 내립니다."
    ],
    "tips": [
      "손목이 팔뚝 위에 오도록 유지하세요.",
      "덤벨끼리 세게 부딪치지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "incline-dumbbell-press",
    "name": "인클라인 덤벨 프레스",
    "englishName": "Incline Dumbbell Chest Press",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders",
      "triceps"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "beginner",
    "movement": "press",
    "instructions": [
      "등받이를 약 45도로 조절한 벤치에 앉아 덤벨을 듭니다.",
      "등을 벤치에 붙이고 덤벨을 윗가슴 양옆에 둡니다.",
      "팔을 펴 덤벨을 어깨 위쪽으로 밀어 올립니다.",
      "팔꿈치를 굽혀 덤벨을 천천히 내립니다."
    ],
    "tips": [
      "발바닥을 바닥에 안정적으로 두세요.",
      "허리를 과하게 젖히지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "dumbbell-fly",
    "name": "덤벨 체스트 플라이",
    "englishName": "Lying Dumbbell Chest Fly",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "shoulders"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "fly",
    "instructions": [
      "벤치에 누워 덤벨을 가슴 위에 들고 손바닥을 마주 봅니다.",
      "팔꿈치를 조금 굽힌 상태로 양팔을 옆으로 벌립니다.",
      "어깨가 편안한 범위까지 천천히 내립니다.",
      "같은 곡선을 따라 덤벨을 가슴 위로 모읍니다."
    ],
    "tips": [
      "팔꿈치 각도를 거의 일정하게 유지하세요.",
      "가벼운 덤벨로 움직임을 조절하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "machine-chest-press",
    "name": "머신 체스트 프레스",
    "englishName": "Seated Machine Chest Press",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "shoulders"
    ],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "press",
    "instructions": [
      "손잡이가 가슴 중간 높이에 오도록 좌석을 조절합니다.",
      "등을 패드에 대고 발을 바닥에 둡니다.",
      "손잡이를 앞으로 밀어 팔을 폅니다.",
      "팔꿈치를 천천히 굽혀 손잡이를 되돌립니다."
    ],
    "tips": [
      "어깨를 귀 쪽으로 올리지 마세요.",
      "중량판이 서로 부딪치지 않게 돌아오세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "one-arm-dumbbell-row",
    "name": "원암 덤벨 로우",
    "englishName": "Single-arm Dumbbell Row",
    "primaryMuscles": [
      "back"
    ],
    "secondaryMuscles": [
      "biceps",
      "shoulders"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "row",
    "instructions": [
      "한 손과 같은 쪽 무릎을 벤치에 대고 반대 손으로 덤벨을 듭니다.",
      "등을 곧게 유지하고 덤벨을 어깨 아래로 늘어뜨립니다.",
      "팔꿈치를 몸통 가까이 당겨 덤벨을 옆구리 쪽으로 올립니다.",
      "팔을 천천히 펴고 반대쪽도 같은 횟수로 수행합니다."
    ],
    "tips": [
      "몸통을 비틀어 덤벨을 올리지 마세요.",
      "어깨를 으쓱하지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "incline-reverse-fly",
    "name": "인클라인 리버스 플라이",
    "englishName": "Incline Dumbbell Reverse Fly",
    "primaryMuscles": [
      "shoulders",
      "back"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "beginner",
    "movement": "fly",
    "instructions": [
      "인클라인 벤치에 가슴을 대고 덤벨을 아래로 늘어뜨립니다.",
      "손바닥을 마주 보고 팔꿈치를 살짝 굽힙니다.",
      "양팔을 옆으로 벌리며 견갑골을 부드럽게 모읍니다.",
      "덤벨을 천천히 시작 위치로 내립니다."
    ],
    "tips": [
      "고개와 등을 일직선으로 두세요.",
      "반동 없이 어깨 높이 정도까지만 벌리세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "machine-high-row",
    "name": "머신 하이 로우",
    "englishName": "Seated Machine High Back Row",
    "primaryMuscles": [
      "back"
    ],
    "secondaryMuscles": [
      "biceps",
      "shoulders"
    ],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "row",
    "instructions": [
      "좌석과 가슴 패드를 조절해 손잡이를 편하게 잡습니다.",
      "발을 지지대에 놓고 몸통을 세웁니다.",
      "팔꿈치를 뒤로 당기며 손잡이를 몸 쪽으로 가져옵니다.",
      "등과 몸통을 유지하며 팔을 천천히 폅니다."
    ],
    "tips": [
      "가슴이 패드에서 떨어지지 않게 하세요.",
      "손목을 꺾어 당기지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "chin-up",
    "name": "친업",
    "englishName": "Chin-up",
    "primaryMuscles": [
      "back",
      "biceps"
    ],
    "secondaryMuscles": [
      "shoulders",
      "abs"
    ],
    "equipment": [
      "pullup-bar"
    ],
    "difficulty": "intermediate",
    "movement": "pulldown",
    "instructions": [
      "손바닥이 몸을 향하도록 철봉을 어깨너비로 잡습니다.",
      "다리를 바닥에서 떼고 몸통을 안정시킵니다.",
      "팔꿈치를 아래로 당겨 턱이 철봉 높이에 오도록 올라갑니다.",
      "팔을 천천히 펴며 시작 위치로 내려옵니다."
    ],
    "tips": [
      "몸을 흔들거나 다리를 차지 마세요.",
      "턱만 앞으로 내밀지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 6
  },
  {
    "id": "pull-up",
    "name": "풀업",
    "englishName": "Pull-up",
    "primaryMuscles": [
      "back"
    ],
    "secondaryMuscles": [
      "biceps",
      "shoulders",
      "abs"
    ],
    "equipment": [
      "pullup-bar"
    ],
    "difficulty": "intermediate",
    "movement": "pulldown",
    "instructions": [
      "손바닥이 앞을 향하도록 철봉을 어깨보다 약간 넓게 잡습니다.",
      "몸을 매달고 배에 힘을 주어 흔들림을 줄입니다.",
      "팔꿈치를 아래로 당겨 몸을 철봉 쪽으로 올립니다.",
      "움직임을 조절하며 팔을 펴 내려옵니다."
    ],
    "tips": [
      "목을 과하게 젖히지 마세요.",
      "반동 없이 수행 가능한 횟수를 선택하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 6
  },
  {
    "id": "dumbbell-front-raise",
    "name": "덤벨 프런트 레이즈",
    "englishName": "Dumbbell Front Raise",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "beginner",
    "movement": "raise",
    "instructions": [
      "발을 골반너비로 벌리고 덤벨을 허벅지 앞에 듭니다.",
      "팔꿈치를 조금 굽히고 배에 힘을 줍니다.",
      "덤벨을 앞쪽으로 어깨 높이까지 들어 올립니다.",
      "같은 경로로 천천히 내립니다."
    ],
    "tips": [
      "허리를 뒤로 젖히지 마세요.",
      "어깨를 으쓱하지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "dumbbell-lateral-raise",
    "name": "덤벨 사이드 레터럴 레이즈",
    "englishName": "Dumbbell Lateral Raise",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "beginner",
    "movement": "raise",
    "instructions": [
      "두 발을 골반너비로 벌리고 덤벨을 몸 옆에 둡니다.",
      "팔꿈치를 살짝 굽히고 손목을 중립으로 둡니다.",
      "양팔을 옆으로 벌려 어깨 높이까지 올립니다.",
      "덤벨을 몸 옆으로 천천히 내립니다."
    ],
    "tips": [
      "몸을 흔들어 올리지 마세요.",
      "손목을 과하게 안으로 돌리지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "seated-dumbbell-press",
    "name": "시티드 덤벨 숄더 프레스",
    "englishName": "Seated Dumbbell Overhead Press",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "press",
    "instructions": [
      "등받이가 세워진 벤치에 앉아 덤벨을 어깨 옆에 듭니다.",
      "손바닥을 앞으로 두고 발을 바닥에 고정합니다.",
      "팔을 펴 덤벨을 머리 위로 밀어 올립니다.",
      "팔꿈치를 천천히 굽혀 어깨 높이로 내립니다."
    ],
    "tips": [
      "갈비뼈를 들며 허리를 젖히지 마세요.",
      "손목을 팔꿈치 위에 두세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "kettlebell-overhead-press",
    "name": "케틀벨 원암 오버헤드 프레스",
    "englishName": "Single-arm Kettlebell Overhead Press",
    "primaryMuscles": [
      "shoulders"
    ],
    "secondaryMuscles": [
      "triceps",
      "abs"
    ],
    "equipment": [
      "kettlebell"
    ],
    "difficulty": "intermediate",
    "movement": "press",
    "instructions": [
      "케틀벨을 한 손으로 잡아 어깨 앞 랙 자세에 둡니다.",
      "발을 골반너비로 벌리고 몸통을 곧게 세웁니다.",
      "팔을 펴 케틀벨을 머리 위로 밀어 올립니다.",
      "어깨 앞까지 천천히 내리고 반대쪽도 반복합니다."
    ],
    "tips": [
      "몸통이 옆으로 기울지 않게 하세요.",
      "손목을 뒤로 꺾지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 8
  },
  {
    "id": "hammer-curl",
    "name": "덤벨 해머 컬",
    "englishName": "Dumbbell Hammer Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "curl",
    "instructions": [
      "덤벨을 몸 옆에 들고 손바닥이 서로 마주 보게 섭니다.",
      "팔꿈치를 옆구리 가까이 둡니다.",
      "손바닥 방향을 유지하며 덤벨을 어깨 쪽으로 올립니다.",
      "팔꿈치를 천천히 펴 덤벨을 내립니다."
    ],
    "tips": [
      "상완을 앞뒤로 흔들지 마세요.",
      "몸을 뒤로 젖혀 들어 올리지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "seated-dumbbell-curl",
    "name": "시티드 덤벨 바이셉스 컬",
    "englishName": "Seated Dumbbell Biceps Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "beginner",
    "movement": "curl",
    "instructions": [
      "벤치에 앉아 덤벨을 양옆에 들고 손바닥을 앞으로 둡니다.",
      "등을 벤치 등받이에 대고 팔꿈치를 몸 가까이 둡니다.",
      "팔꿈치를 굽혀 덤벨을 어깨 쪽으로 올립니다.",
      "움직임을 조절하며 덤벨을 내립니다."
    ],
    "tips": [
      "손목을 꺾지 마세요.",
      "팔꿈치 위치를 유지하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "machine-biceps-curl",
    "name": "머신 바이셉스 컬",
    "englishName": "Seated Machine Biceps Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "curl",
    "instructions": [
      "좌석을 조절해 팔꿈치가 기구 회전축과 나란하도록 앉습니다.",
      "상완을 패드에 대고 손잡이를 잡습니다.",
      "팔꿈치를 굽혀 손잡이를 위로 당깁니다.",
      "팔을 천천히 펴 시작 위치로 돌아옵니다."
    ],
    "tips": [
      "어깨를 들어 올리지 마세요.",
      "상완을 패드에서 떼지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "lying-barbell-triceps-extension",
    "name": "라잉 바벨 트라이셉스 익스텐션",
    "englishName": "Lying Barbell Triceps Extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "barbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "extension",
    "instructions": [
      "벤치에 누워 바벨을 어깨너비로 잡고 얼굴 위에 듭니다.",
      "상완을 고정하고 팔꿈치를 천천히 굽힙니다.",
      "바벨을 이마 위쪽으로 조절해 내립니다.",
      "팔꿈치를 펴 바벨을 시작 위치로 올립니다."
    ],
    "tips": [
      "바벨이 머리에 닿지 않도록 조절하세요.",
      "양 팔꿈치가 과하게 벌어지지 않게 하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "overhead-dumbbell-triceps-extension",
    "name": "덤벨 오버헤드 트라이셉스 익스텐션",
    "englishName": "Standing Overhead Dumbbell Triceps Extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "abs"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "extension",
    "instructions": [
      "한 발을 약간 앞에 두고 덤벨 하나를 두 손으로 잡습니다.",
      "덤벨을 머리 위로 올리고 팔꿈치를 앞쪽으로 둡니다.",
      "상완을 고정한 채 팔꿈치를 굽혀 덤벨을 머리 뒤로 내립니다.",
      "팔꿈치를 펴 덤벨을 머리 위로 올립니다."
    ],
    "tips": [
      "허리를 과하게 젖히지 마세요.",
      "덤벨이 뒤통수에 닿지 않도록 하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "dumbbell-triceps-kickback",
    "name": "덤벨 트라이셉스 킥백",
    "englishName": "Dumbbell Triceps Kickback",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "shoulders"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "beginner",
    "movement": "extension",
    "instructions": [
      "발을 앞뒤로 두고 엉덩이를 접어 상체를 기울입니다.",
      "덤벨을 잡은 팔꿈치를 몸 옆에 들어 상완을 고정합니다.",
      "팔꿈치를 펴 덤벨을 뒤쪽으로 보냅니다.",
      "상완을 유지하며 팔꿈치를 천천히 굽혀 돌아옵니다."
    ],
    "tips": [
      "등을 둥글게 말지 마세요.",
      "팔 전체를 앞뒤로 흔들지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "cable-triceps-pressdown",
    "name": "케이블 트라이셉스 프레스다운",
    "englishName": "Cable Triceps Pressdown",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "cable"
    ],
    "difficulty": "beginner",
    "movement": "extension",
    "instructions": [
      "높은 풀리에 바를 연결하고 양손으로 잡습니다.",
      "팔꿈치를 옆구리에 붙이고 무릎을 가볍게 굽힙니다.",
      "팔꿈치를 펴 바를 허벅지 앞쪽으로 내립니다.",
      "팔꿈치가 움직이지 않게 손을 천천히 올립니다."
    ],
    "tips": [
      "체중으로 로프를 누르지 마세요.",
      "손목을 곧게 유지하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "machine-triceps-extension",
    "name": "머신 트라이셉스 익스텐션",
    "englishName": "Seated Machine Triceps Extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "extension",
    "instructions": [
      "좌석을 조절해 팔꿈치가 기구 회전축에 맞도록 앉습니다.",
      "상완을 패드에 놓고 손잡이를 잡습니다.",
      "팔꿈치를 펴 손잡이를 아래로 누릅니다.",
      "팔꿈치를 천천히 굽혀 시작 위치로 돌아옵니다."
    ],
    "tips": [
      "등을 등받이에 안정적으로 두세요.",
      "팔꿈치를 강하게 잠그지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "bodyweight-squat",
    "name": "맨몸 스쿼트",
    "englishName": "Bodyweight Squat",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "beginner",
    "movement": "squat",
    "instructions": [
      "발을 어깨너비 정도로 벌리고 발끝을 약간 바깥으로 둡니다.",
      "엉덩이와 무릎을 함께 굽혀 앉습니다.",
      "발바닥을 유지하며 조절할 수 있는 깊이까지 내려갑니다.",
      "바닥을 밀고 무릎과 엉덩이를 펴 일어납니다."
    ],
    "tips": [
      "무릎이 발끝 방향을 따라 움직이게 하세요.",
      "뒤꿈치가 들리지 않도록 하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 15
  },
  {
    "id": "dumbbell-front-squat",
    "name": "덤벨 프런트 스쿼트",
    "englishName": "Dumbbell Front Squat",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "back"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "squat",
    "instructions": [
      "덤벨 두 개를 어깨 앞에 들고 발을 어깨너비로 벌립니다.",
      "배에 힘을 주고 가슴을 세웁니다.",
      "엉덩이와 무릎을 굽혀 천천히 내려갑니다.",
      "발 전체로 바닥을 밀며 일어납니다."
    ],
    "tips": [
      "팔꿈치와 덤벨이 아래로 무너지지 않게 하세요.",
      "무릎을 안쪽으로 모으지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "dumbbell-goblet-squat",
    "name": "덤벨 고블릿 스쿼트",
    "englishName": "Dumbbell Goblet Squat",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "back"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "squat",
    "instructions": [
      "덤벨 한쪽 끝을 두 손으로 받쳐 가슴 앞에 세웁니다.",
      "발을 어깨너비 정도로 벌리고 배에 힘을 줍니다.",
      "무릎을 발끝 방향으로 굽히며 엉덩이를 내립니다.",
      "발바닥으로 바닥을 밀어 일어납니다."
    ],
    "tips": [
      "덤벨을 몸 가까이 유지하세요.",
      "가슴을 과하게 숙이지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "forward-lunge",
    "name": "맨몸 포워드 런지",
    "englishName": "Bodyweight Forward Lunge",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "intermediate",
    "movement": "lunge",
    "instructions": [
      "발을 골반너비로 벌리고 똑바로 섭니다.",
      "한 발을 앞으로 내딛고 양 무릎을 굽힙니다.",
      "앞발 전체를 바닥에 둔 채 뒤 무릎을 바닥 가까이 내립니다.",
      "앞발로 바닥을 밀어 돌아오고 반대쪽도 반복합니다."
    ],
    "tips": [
      "앞 무릎이 발끝 방향을 따르게 하세요.",
      "몸통을 옆으로 기울이지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "dumbbell-lunge",
    "name": "덤벨 런지",
    "englishName": "Dumbbell Lunge",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "lunge",
    "instructions": [
      "양손에 덤벨을 들고 몸 옆에 둡니다.",
      "한 발을 앞으로 내딛고 몸통을 세웁니다.",
      "양 무릎을 굽혀 뒤 무릎을 바닥 가까이 내립니다.",
      "앞발로 바닥을 밀어 돌아오고 반대쪽도 반복합니다."
    ],
    "tips": [
      "덤벨을 앞뒤로 흔들지 마세요.",
      "발을 한 줄이 아닌 골반너비로 내디디세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "bulgarian-split-squat",
    "name": "덤벨 불가리안 스플릿 스쿼트",
    "englishName": "Dumbbell Bulgarian Split Squat",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "advanced",
    "movement": "lunge",
    "instructions": [
      "벤치를 등지고 서서 덤벨 하나를 두 손으로 가슴 앞에 듭니다.",
      "한쪽 발등을 뒤쪽 벤치에 올리고 앞발 위치를 잡습니다.",
      "앞 무릎과 엉덩이를 굽혀 몸을 천천히 내립니다.",
      "앞발로 바닥을 밀어 올라온 뒤 반대쪽도 수행합니다."
    ],
    "tips": [
      "뒤쪽 발로 몸을 튕겨 올리지 마세요.",
      "앞 무릎이 안쪽으로 무너지지 않게 하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 8
  },
  {
    "id": "dumbbell-lateral-lunge",
    "name": "덤벨 사이드 런지",
    "englishName": "Dumbbell Lateral Lunge",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "intermediate",
    "movement": "lunge",
    "instructions": [
      "덤벨을 몸 옆에 들고 발을 골반너비로 벌립니다.",
      "한쪽 발을 옆으로 크게 내딛습니다.",
      "내디딘 쪽 무릎을 굽히며 엉덩이를 뒤로 보냅니다.",
      "내디딘 발로 바닥을 밀어 돌아오고 반대쪽도 반복합니다."
    ],
    "tips": [
      "반대쪽 다리는 길게 유지하세요.",
      "내디딘 발바닥 전체를 바닥에 두세요."
    ],
    "defaultSets": 3,
    "defaultReps": 10
  },
  {
    "id": "glute-bridge",
    "name": "글루트 브리지",
    "englishName": "Glute Bridge",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "beginner",
    "movement": "hinge",
    "instructions": [
      "등을 대고 누워 무릎을 굽히고 발을 골반너비로 둡니다.",
      "팔을 바닥에 놓고 배에 힘을 줍니다.",
      "발로 바닥을 밀어 어깨부터 무릎까지 일직선이 되도록 엉덩이를 올립니다.",
      "엉덩이를 천천히 바닥으로 내립니다."
    ],
    "tips": [
      "허리를 꺾어 높이 올리지 마세요.",
      "무릎 간격을 일정하게 유지하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 15
  },
  {
    "id": "dumbbell-hip-thrust",
    "name": "벤치 덤벨 힙 스러스트",
    "englishName": "Bench Dumbbell Hip Thrust",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "difficulty": "intermediate",
    "movement": "hinge",
    "instructions": [
      "움직이지 않는 벤치에 등 위쪽을 대고 발을 바닥에 둡니다.",
      "양손에 든 덤벨을 골반 양쪽 위에 놓고 고정합니다.",
      "발로 바닥을 밀며 엉덩이를 올려 몸통과 허벅지를 나란히 만듭니다.",
      "덤벨을 고정한 채 엉덩이를 천천히 내립니다."
    ],
    "tips": [
      "턱을 가볍게 당기고 허리를 젖히지 마세요.",
      "벤치가 밀리지 않는지 먼저 확인하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "single-leg-dumbbell-rdl",
    "name": "원암 싱글 레그 루마니안 데드리프트",
    "englishName": "Single-arm Single-leg Dumbbell Romanian Deadlift",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "back",
      "abs"
    ],
    "equipment": [
      "dumbbell"
    ],
    "difficulty": "advanced",
    "movement": "hinge",
    "instructions": [
      "한 손에 덤벨을 들고 반대쪽 다리로 섭니다.",
      "지지하는 무릎을 약간 굽히고 엉덩이를 뒤로 접습니다.",
      "떠 있는 다리를 뒤로 보내며 덤벨을 바닥 쪽으로 내립니다.",
      "엉덩이를 펴 일어서고 반대쪽도 같은 횟수로 반복합니다."
    ],
    "tips": [
      "골반이 옆으로 열리지 않게 하세요.",
      "등을 둥글게 말지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 8
  },
  {
    "id": "lying-leg-curl",
    "name": "라잉 레그 컬",
    "englishName": "Machine Lying Hamstring Curl",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "curl",
    "instructions": [
      "기구에 엎드려 무릎을 회전축에 맞추고 종아리 아래쪽 뒤에 패드를 둡니다.",
      "골반을 패드에 붙이고 손잡이를 잡습니다.",
      "무릎을 굽혀 패드를 엉덩이 쪽으로 올립니다.",
      "골반을 유지하며 다리를 천천히 폅니다."
    ],
    "tips": [
      "허리를 꺾거나 엉덩이를 들지 마세요.",
      "발목으로 패드를 차지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  },
  {
    "id": "machine-calf-raise",
    "name": "머신 시티드 카프 프레스",
    "englishName": "Machine Seated Calf Press",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "calf-raise",
    "instructions": [
      "좌석을 조절해 다리가 골반보다 약간 낮게 앞쪽으로 뻗도록 앉습니다.",
      "발 앞부분을 발판에 대고 무릎과 몸통을 안정시킵니다.",
      "발목을 펴며 발 앞부분으로 발판을 밀어냅니다.",
      "발목을 천천히 굽혀 시작 위치로 돌아옵니다."
    ],
    "tips": [
      "발목을 안팎으로 기울이지 마세요.",
      "반동으로 튕기지 마세요."
    ],
    "defaultSets": 3,
    "defaultReps": 15
  },
  {
    "id": "crunch",
    "name": "크런치",
    "englishName": "Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "beginner",
    "movement": "crunch",
    "instructions": [
      "등을 대고 누워 무릎을 굽히고 발을 바닥에 둡니다.",
      "손을 머리 뒤에 가볍게 두고 팔꿈치를 옆으로 벌립니다.",
      "숨을 내쉬며 갈비뼈를 골반 쪽으로 모아 견갑골을 살짝 듭니다.",
      "몸통을 천천히 바닥으로 내립니다."
    ],
    "tips": [
      "손으로 목을 당기지 마세요.",
      "상체를 완전히 일으키지 않아도 됩니다."
    ],
    "defaultSets": 3,
    "defaultReps": 15
  },
  {
    "id": "front-plank",
    "name": "프런트 플랭크",
    "englishName": "Front Plank",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "shoulders",
      "glutes"
    ],
    "equipment": [
      "bodyweight"
    ],
    "difficulty": "intermediate",
    "movement": "plank",
    "measurement": { "kind": "hold", "secondsPerRep": 20 },
    "instructions": [
      "팔꿈치를 어깨 아래에 놓고 전완과 발끝으로 바닥을 지지합니다.",
      "배와 엉덩이에 힘을 주어 몸을 일직선으로 만듭니다.",
      "호흡을 유지하며 20초 동안 자세를 유지합니다.",
      "무릎을 바닥에 내려 한 번의 유지 동작을 마칩니다."
    ],
    "tips": [
      "허리가 처지거나 엉덩이가 높이 들리지 않게 하세요.",
      "기본 1회는 20초 유지입니다."
    ],
    "defaultSets": 3,
    "defaultReps": 1
  },
  {
    "id": "machine-crunch",
    "name": "머신 크런치",
    "englishName": "Seated Machine Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "machine"
    ],
    "difficulty": "beginner",
    "movement": "crunch",
    "instructions": [
      "좌석과 패드를 조절하고 기구에 앉아 손잡이를 잡습니다.",
      "발을 지지대에 놓고 골반을 안정시킵니다.",
      "갈비뼈를 골반 쪽으로 모으듯 몸통을 굽힙니다.",
      "중량이 끌어당기지 않게 조절하며 몸통을 되돌립니다."
    ],
    "tips": [
      "팔로 손잡이만 당기지 마세요.",
      "움직임을 천천히 조절하세요."
    ],
    "defaultSets": 3,
    "defaultReps": 12
  }
];
