import type { ManualFitnessDay } from "@/lib/fitness/types";
import { parseWorkoutCompletedField } from "@/lib/fitness/parseBoolean";
import type { RawFitnessRow } from "@/lib/fitness/normalizeRow";

export function normalizeManualFitnessRow(
  raw: RawFitnessRow,
  rowIndex: number,
): { ok: true; value: ManualFitnessDay } | { ok: false; error: string } {
  const date = (raw.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: `Row ${rowIndex + 1}: invalid date "${raw.date}"` };
  }

  const caloriesRaw = (raw.calories_burned ?? "").trim();
  let caloriesBurned: number | null = null;
  if (caloriesRaw !== "" && caloriesRaw !== "null") {
    const n = Number(caloriesRaw);
    if (!Number.isFinite(n) || n < 0) {
      return {
        ok: false,
        error: `Row ${rowIndex + 1}: invalid calories_burned "${raw.calories_burned}"`,
      };
    }
    caloriesBurned = n;
  }

  const weightRaw = (raw.weight ?? "").trim();
  const weight =
    weightRaw === "" || weightRaw === "null"
      ? null
      : (() => {
          const w = Number(weightRaw);
          return Number.isFinite(w) && w > 0 ? w : null;
        })();

  return {
    ok: true,
    value: {
      date,
      caloriesBurned,
      weight,
      workoutCompleted: parseWorkoutCompletedField(raw.workout_completed),
    },
  };
}
