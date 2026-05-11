import Papa from "papaparse";
import { FITNESS_CSV_HEADERS } from "@/lib/fitness/columns";
import { normalizeFitnessRow, type RawFitnessRow } from "@/lib/fitness/normalizeRow";
import type { FitnessDay } from "@/lib/fitness/types";

function headersMatch(fields: string[] | undefined): boolean {
  if (!fields || fields.length < FITNESS_CSV_HEADERS.length) return false;
  const normalized = fields.map((h) => h.trim().toLowerCase());
  return FITNESS_CSV_HEADERS.every((expected, i) => normalized[i] === expected);
}

export type ParseFitnessCsvResult =
  | { ok: true; rows: FitnessDay[] }
  | { ok: false; errors: string[] };

export function parseFitnessCsv(text: string): ParseFitnessCsvResult {
  const parsed = Papa.parse<RawFitnessRow>(text, {
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
  if (!headersMatch(fields)) {
    return {
      ok: false,
      errors: [
        `Expected header row: ${FITNESS_CSV_HEADERS.join(",")}. Got: ${(fields ?? []).join(",")}`,
      ],
    };
  }

  const errors: string[] = [];
  const rows: FitnessDay[] = [];
  const data = parsed.data ?? [];

  for (let i = 0; i < data.length; i++) {
    const raw = data[i];
    const result = normalizeFitnessRow(raw, i);
    if (!result.ok) errors.push(result.error);
    else rows.push(result.value);
  }

  if (errors.length > 0) return { ok: false, errors };

  const byDate = new Map<string, FitnessDay>();
  for (const row of rows) {
    byDate.set(row.date, row);
  }

  return { ok: true, rows: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)) };
}
