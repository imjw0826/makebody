import type { Exercise } from "./exercises";

const repetitions = {
  repsLabel: "반복 횟수",
  repsSuffix: "회",
  guidance: "맨몸 운동의 무게는 0kg으로 기록하세요.",
};

/** Shared form/history units; movement describes mechanics, not recording units. */
export function exerciseMeasurement(exercise?: Pick<Exercise, "measurement">) {
  const measurement = exercise?.measurement;
  if (measurement?.kind !== "hold") return repetitions;

  const seconds = measurement.secondsPerRep;
  return {
    repsLabel: `유지 횟수 (${seconds}초)`,
    repsSuffix: `회 (1회 ${seconds}초 유지)`,
    guidance: `1회 = ${seconds}초 유지입니다. 무게는 0kg으로 기록하세요.`,
  };
}
