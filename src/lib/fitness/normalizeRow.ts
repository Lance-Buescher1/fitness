import type { FitnessDay } from "@/lib/fitness/types";
import { parseBooleanLoose } from "@/lib/fitness/parseBoolean";

export type RawFitnessRow = Record<string, string | undefined>;

export function normalizeFitnessRow(
  raw: RawFitnessRow,
  rowIndex: number,
): { ok: true; value: FitnessDay } | { ok: false; error: string } {
  const date = (raw.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: `Row ${rowIndex + 1}: invalid date "${raw.date}"` };
  }

  const caloriesRaw = (raw.calories_burned ?? "").trim();
  const caloriesBurned = Number(caloriesRaw);
  if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
    return {
      ok: false,
      error: `Row ${rowIndex + 1}: invalid calories_burned "${raw.calories_burned}"`,
    };
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
      workoutCompleted: parseBooleanLoose(raw.workout_completed),
    },
  };
}
