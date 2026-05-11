import type { FitnessDay, ManualFitnessDay } from "@/lib/fitness/types";
import { mergeFitnessSources } from "@/lib/fitness/mergeFitnessSources";
import type { MergeFitnessSourcesResult } from "@/lib/fitness/mergeFitnessSources";

export function fitnessDaysToManualMap(rows: FitnessDay[]): Map<string, ManualFitnessDay> {
  const m = new Map<string, ManualFitnessDay>();
  for (const r of rows) {
    m.set(r.date, {
      date: r.date,
      caloriesBurned: r.caloriesBurned,
      weight: r.weight,
      workoutCompleted: r.workoutCompleted,
    });
  }
  return m;
}

/**
 * Union of dates in the file and in the app. File row wins for workout; calories and weight fill
 * from the file when set, otherwise keep existing (so blank calories in the file keep prior burn).
 */
export function mergeManualCsvWithExistingLedger(
  fileByDate: Map<string, ManualFitnessDay>,
  existing: FitnessDay[],
): MergeFitnessSourcesResult {
  const existingM = fitnessDaysToManualMap(existing);
  const dates = new Set([...fileByDate.keys(), ...existingM.keys()]);
  const out = new Map<string, ManualFitnessDay>();

  for (const date of dates) {
    const f = fileByDate.get(date);
    const e = existingM.get(date);
    if (f != null && e != null) {
      out.set(date, {
        date,
        caloriesBurned: f.caloriesBurned ?? e.caloriesBurned,
        weight: f.weight ?? e.weight,
        workoutCompleted: f.workoutCompleted ?? e.workoutCompleted,
      });
    } else if (f != null) {
      out.set(date, f);
    } else if (e != null) {
      out.set(date, e);
    }
  }

  return mergeFitnessSources(out, new Map());
}
