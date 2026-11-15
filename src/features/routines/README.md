# 루틴 (`src/features/routines`)

루틴 만들기(`RoutineBuilder`)와 따라 하는 운동 세션(`WorkoutSession`). 의존성은 React뿐이고, 스타일은
`routines.css`(모든 클래스 `rt-` 접두사)가 컴포넌트에서 자동으로 불려 옵니다. 앱의 기록 저장소는 직접 읽지 않고
props로만 주고받습니다.

## 붙이는 법 (15줄)

```tsx
import { exercises } from './data/exercises';
import ExerciseAnimation from './components/ExerciseAnimation';
import { RoutineBuilder } from './features/routines';

function RoutinesPage({ onOpenExercise }: { onOpenExercise: (id: string) => void }) {
  return (
    <RoutineBuilder
      exercises={exercises} // extraExercises가 있으면 [...exercises, ...extraExercises]
      onSelectExercise={onOpenExercise} // 운동 이름을 누르면 상세 화면으로
      renderAnimation={(exercise) => <ExerciseAnimation exercise={exercise} playing compact />}
      onLogSet={(entry) => saveSet(entry)} // { exerciseId, date: 'YYYY-MM-DD', setIndex, reps, weightKg }
      onFinish={(summary) => console.info('운동 완료', summary)}
    />
  );
}
```

`saveSet`은 앱의 기록 저장 함수로 바꿔 주세요. `onLogSet`은 세트를 완료할 때마다 한 번, `onFinish`는 세션이 끝날 때 한 번 불립니다.

## 내보내는 것

| 이름 | 설명 |
| --- | --- |
| `RoutineBuilder` | `{ exercises; onSelectExercise?; onStartRoutine?; renderAnimation?; onLogSet?; onFinish?; className? }` |
| `WorkoutSession` | `{ routine; exercises; renderAnimation?; onLogSet?; onFinish?; onExit? }` |
| `useRoutines()` | `{ routines, storageError, createRoutine, renameRoutine, duplicateRoutine, deleteRoutine, addItem, removeItem, moveItem, updateItem }` |
| `useSavedSession()` / `clearSavedSession()` | 끝내지 않은 세션 요약(없으면 `null`) / 저장된 세션 지우기 |
| `itemFromExercise`, `buildStarterTemplates`, `getRoutineStats` | 보조 함수 |
| 타입 | `Routine`, `RoutineItem`, `LogSetEntry`, `WorkoutSummary`, `WorkoutSummaryExercise`, `RoutineBuilderProps`, `WorkoutSessionProps`, `UseRoutinesResult`, `SavedSessionInfo`, `StarterTemplate`, `RoutineStats`, `MuscleCoverage` |

## 알아 둘 동작

- **세션을 어디서 띄울지**: `onStartRoutine`을 넘기지 않으면 `RoutineBuilder`가 같은 자리에서 `WorkoutSession`을 열고
  `renderAnimation` / `onLogSet` / `onFinish`를 그대로 전달합니다. 넘기면 콜백만 호출하니 직접 `<WorkoutSession>`을 그리세요.
- **저장 키**: 루틴 `form.routines.v1` (`{ version: 1, routines }`), 세션 `form.session.v1`. 깨진 값은 버리고 빈 상태로 시작합니다.
- **세션은 한 번에 하나**: 다른 루틴을 시작하면 저장된 진행 상황을 덮어씁니다. 끝내지 않은 세션이 있으면 `RoutineBuilder`
  위쪽에 "이어서 하기" 안내가 뜹니다(새로고침 후 자동으로 세션 화면으로 들어가지는 않습니다).
- **완료한 세트는 되돌릴 수 없습니다**: 완료 즉시 `onLogSet`으로 넘어가기 때문에 잠급니다. `setIndex`는 운동 안에서 0부터 셉니다.
  무게를 비운 세트는 `weightKg: 0`으로 전달됩니다.
- **루틴 안에서 같은 운동은 한 번만** 담을 수 있습니다. `exercises`에 없는 id는 편집기에 "찾을 수 없는 운동"으로 보이고 세션에서는 건너뜁니다.
- **운동 시간**은 화면을 닫아 둔 동안(새로고침·탭 종료 사이)을 뺀 값이고, 휴식 타이머는 종료 시각을 저장하므로 새로고침해도 이어집니다.
- **스타일**: `.rt-root`가 `--accent`, `--ink`, `--muted`, `--border`, `--surface`, `--selection` 토큰을 읽고 없으면 기본값을 씁니다.
  반응형은 화면이 아니라 `.rt-root`의 너비(container query) 기준이라 좁은 칼럼에 넣어도 맞춰집니다.
- **추천 루틴**(상체 밀기 / 상체 당기기 / 하체)은 넘겨받은 `exercises`에서만 고르고, 맞는 운동이 없으면 그 카드는 나오지 않습니다.
