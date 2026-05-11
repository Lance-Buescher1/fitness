import type { FitnessDay } from "@/lib/fitness/types";
import type { HeatmapMetric } from "@/lib/heatmap/types";

const CAL_LEVELS = 4;

function bucketCalories(value: number, min: number, max: number): number {
  if (max <= min) return CAL_LEVELS;
  const t = (value - min) / (max - min);
  const b = Math.ceil(t * CAL_LEVELS);
  return Math.min(CAL_LEVELS, Math.max(1, b));
}

export function caloriesRange(rows: FitnessDay[]): { min: number; max: number } {
  const vals = rows.map((r) => r.caloriesBurned).filter((n) => Number.isFinite(n));
  if (vals.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

export function intensityForDay(
  day: FitnessDay | undefined,
  metric: HeatmapMetric,
  calRange: { min: number; max: number },
): number {
  if (!day) return 0;
  if (metric === "workout") {
    return day.workoutCompleted ? 2 : 1;
  }
  return bucketCalories(day.caloriesBurned, calRange.min, calRange.max);
}
