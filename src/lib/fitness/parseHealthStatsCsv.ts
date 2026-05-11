import Papa from "papaparse";
import { isHealthStatsCsvFormat } from "@/lib/fitness/detectCsvKind";

export type ParseHealthStatsCsvResult =
  | { ok: true; maxCaloriesByDate: Map<string, number> }
  | { ok: false; errors: string[] };

type RawStatsRow = Record<string, string | undefined>;

export function parseHealthStatsCsv(text: string): ParseHealthStatsCsvResult {
  const parsed = Papa.parse<RawStatsRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return {
      ok: false,
      errors: parsed.errors.map((e) => e.message || "CSV parse error"),
    };
  }

  const fields = parsed.meta.fields;
  if (!isHealthStatsCsvFormat(fields)) {
    return {
      ok: false,
      errors: [
        "health_stats CSV must include columns date and calories_burned, and must not use the full fitness.csv header (no workout_completed column).",
      ],
    };
  }

  const errors: string[] = [];
  const maxCaloriesByDate = new Map<string, number>();
  const data = parsed.data ?? [];

  for (let i = 0; i < data.length; i++) {
    const raw = data[i];
    const date = (raw.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i + 1}: invalid date "${raw.date}"`);
      continue;
    }

    const caloriesRaw = (raw.calories_burned ?? "").trim();
    const calories = Number(caloriesRaw);
    if (!Number.isFinite(calories) || calories < 0) {
      errors.push(`Row ${i + 1}: invalid calories_burned "${raw.calories_burned}"`);
      continue;
    }

    const prev = maxCaloriesByDate.get(date);
    maxCaloriesByDate.set(date, prev === undefined ? calories : Math.max(prev, calories));
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, maxCaloriesByDate };
}
