import type { Exercise, MovementId, MuscleId } from '../../data/exercises';
import type { RoutineItem } from './types';
import { itemFromExercise } from './useRoutines';

export interface StarterTemplate {
  id: 'push' | 'pull' | 'legs';
  name: string;
  description: string;
  items: RoutineItem[];
}

type Slot = (exercise: Exercise) => boolean;

const primary = (exercise: Exercise, ...ids: MuscleId[]) => exercise.primaryMuscles.some((id) => ids.includes(id));
const moves = (exercise: Exercise, ...ids: MovementId[]) => ids.includes(exercise.movement);

interface Blueprint {
  id: StarterTemplate['id'];
  name: string;
  description: string;
  /** 순서대로 한 자리씩, 조건에 맞는 첫 운동을 고릅니다. */
  slots: Slot[];
  /** 자리를 다 못 채웠을 때 보충할 운동의 조건 */
  filler: Slot;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'push',
    name: '상체 밀기',
    description: '가슴 · 어깨 · 삼두근',
    slots: [
      (e) => primary(e, 'chest') && moves(e, 'press'),
      (e) => primary(e, 'chest') && moves(e, 'pushup', 'fly'),
      (e) => primary(e, 'shoulders') && moves(e, 'press'),
      (e) => primary(e, 'shoulders') && moves(e, 'raise'),
      (e) => primary(e, 'triceps'),
    ],
    filler: (e) => primary(e, 'chest', 'shoulders', 'triceps') && !primary(e, 'back', 'biceps'),
  },
  {
    id: 'pull',
    name: '상체 당기기',
    description: '등 · 이두근',
    slots: [
      (e) => primary(e, 'back') && moves(e, 'pulldown'),
      (e) => primary(e, 'back') && moves(e, 'row'),
      (e) => primary(e, 'back') && moves(e, 'row', 'fly', 'pulldown'),
      (e) => primary(e, 'biceps') && moves(e, 'curl'),
      (e) => primary(e, 'biceps') && !primary(e, 'back'),
    ],
    filler: (e) => primary(e, 'back', 'biceps'),
  },
  {
    id: 'legs',
    name: '하체',
    description: '대퇴사두근 · 둔근 · 햄스트링 · 종아리',
    slots: [
      (e) => moves(e, 'squat'),
      (e) => moves(e, 'lunge'),
      (e) => moves(e, 'hinge'),
      (e) => primary(e, 'hamstrings'),
      (e) => primary(e, 'calves'),
    ],
    filler: (e) => primary(e, 'quads', 'hamstrings', 'glutes', 'calves'),
  },
];

const MIN_ITEMS = 3;

/**
 * 전달받은 운동만으로 스타터 템플릿을 만듭니다.
 * 조건에 맞는 운동이 하나도 없는 템플릿은 결과에서 빠집니다.
 */
export function buildStarterTemplates(exercises: Exercise[]): StarterTemplate[] {
  const templates: StarterTemplate[] = [];
  for (const blueprint of BLUEPRINTS) {
    const used = new Set<string>();
    const picked: Exercise[] = [];
    const take = (slot: Slot) => {
      const match = exercises.find((exercise) => !used.has(exercise.id) && slot(exercise));
      if (!match) return false;
      used.add(match.id);
      picked.push(match);
      return true;
    };
    blueprint.slots.forEach(take);
    while (picked.length < MIN_ITEMS && take(blueprint.filler)) {
      /* 부족한 자리를 같은 부위 운동으로 채움 */
    }
    if (picked.length === 0) continue;
    templates.push({
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description,
      items: picked.map(itemFromExercise),
    });
  }
  return templates;
}
