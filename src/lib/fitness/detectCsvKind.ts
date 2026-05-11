import Papa from "papaparse";
import { FITNESS_CSV_HEADERS } from "@/lib/fitness/columns";

function headersExactFitness(fields: string[] | undefined): boolean {
  if (!fields || fields.length !== FITNESS_CSV_HEADERS.length) return false;
  const normalized = fields.map((h) => h.trim().toLowerCase());
  return FITNESS_CSV_HEADERS.every((expected, i) => normalized[i] === expected);
}

/** Headers for `health_stats.csv`: date + calories_burned, optional extra columns; not the full manual template. */
export function isHealthStatsCsvFormat(fields: string[] | undefined): boolean {
  if (!fields?.length) return false;
  if (headersExactFitness(fields)) return false;
  const set = new Set(fields.map((h) => h.trim().toLowerCase()));
  return set.has("date") && set.has("calories_burned") && !set.has("workout_completed");
}

export type FitnessCsvKind = "strict-fitness" | "health-stats" | "unknown";

export function detectFitnessCsvKind(text: string): FitnessCsvKind {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    preview: 2,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const fields = parsed.meta.fields;
  if (headersExactFitness(fields)) return "strict-fitness";
  if (isHealthStatsCsvFormat(fields)) return "health-stats";
  return "unknown";
}
