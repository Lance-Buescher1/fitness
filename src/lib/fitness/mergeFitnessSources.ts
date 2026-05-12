import type { FitnessDay } from "@/lib/fitness/types";
import type { ManualFitnessDay } from "@/lib/fitness/types";

export type MergeFitnessSourcesResult =
  | { ok: true; rows: FitnessDay[] }
  | { ok: false; errors: string[] };

/**
 * Merges manual rows (`fitness.csv`) with HealthKit-style stats (`health_stats.csv`).
 * Calories: stats win when present; otherwise manual cell; otherwise `null` (not logged).
 * Workout: from manual when present; otherwise `null` (not logged).
 */
export function mergeFitnessSources(
  manualByDate: Map<string, ManualFitnessDay>,
  maxCaloriesByDate: Map<string, number>,
): MergeFitnessSourcesResult {
  const dates = new Set<string>([...manualByDate.keys(), ...maxCaloriesByDate.keys()]);
  const sorted = Array.from(dates).sort((a, b) => a.localeCompare(b));
  const rows: FitnessDay[] = [];

  for (const date of sorted) {
    const manual = manualByDate.get(date);
    const statsCalories = maxCaloriesByDate.get(date);
    const caloriesBurned =
      statsCalories !== undefined ? statsCalories : (manual?.caloriesBurned ?? null);

    if (caloriesBurned != null && (!Number.isFinite(caloriesBurned) || caloriesBurned < 0)) {
      return {
        ok: false,
        errors: [`Date ${date}: invalid calories_burned (must be empty or a non‑negative number).`],
      };
    }

    rows.push({
      date,
      caloriesBurned,
      weight: manual?.weight ?? null,
      workoutCompleted: manual?.workoutCompleted ?? null,
    });
  }

  return { ok: true, rows };
}
