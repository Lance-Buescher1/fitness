import Papa from "papaparse";
import { FITNESS_CSV_HEADERS } from "@/lib/fitness/columns";
import type { FitnessDay } from "@/lib/fitness/types";

type CsvRow = {
  date: string;
  calories_burned: string;
  weight: string;
  workout_completed: string;
};

function cellCalories(n: number | null): string {
  if (n == null) return "";
  return String(n);
}

function cellWeight(n: number | null): string {
  if (n == null) return "";
  return String(n);
}

function cellWorkout(v: boolean | null): string {
  if (v === null) return "";
  return v ? "true" : "false";
}

/** Manual `fitness.csv` body (header + rows), suitable for File System Access write. */
export function serializeManualFitnessCsv(rows: FitnessDay[]): string {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const data: CsvRow[] = sorted.map((r) => ({
    date: r.date,
    calories_burned: cellCalories(r.caloriesBurned),
    weight: cellWeight(r.weight),
    workout_completed: cellWorkout(r.workoutCompleted),
  }));
  return Papa.unparse(data, {
    columns: [...FITNESS_CSV_HEADERS],
    header: true,
  });
}
