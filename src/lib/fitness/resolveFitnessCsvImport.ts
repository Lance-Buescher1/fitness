import type { FitnessDay } from "@/lib/fitness/types";
import { detectFitnessCsvKind } from "@/lib/fitness/detectCsvKind";
import { mergeFitnessSources } from "@/lib/fitness/mergeFitnessSources";
import { parseFitnessCsv } from "@/lib/fitness/parseCsv";
import { parseHealthStatsCsv } from "@/lib/fitness/parseHealthStatsCsv";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";

export type ResolveFitnessCsvImportResult =
  | { ok: true; rows: FitnessDay[] }
  | { ok: false; errors: string[] };

export type CsvImportInput = { filename: string; text: string };

export function resolveFitnessCsvImport(inputs: CsvImportInput[]): ResolveFitnessCsvImportResult {
  if (inputs.length === 0) {
    return { ok: false, errors: ["No CSV files selected."] };
  }
  if (inputs.length > 2) {
    return { ok: false, errors: ["Select at most two CSV files (fitness.csv + health_stats.csv)."] };
  }

  if (inputs.length === 1) {
    const { filename, text } = inputs[0];
    const kind = detectFitnessCsvKind(text);
    if (kind === "strict-fitness") {
      return parseFitnessCsv(text);
    }
    if (kind === "health-stats") {
      const stats = parseHealthStatsCsv(text);
      if (!stats.ok) return stats;
      return mergeFitnessSources(new Map(), stats.maxCaloriesByDate);
    }
    return {
      ok: false,
      errors: [
        `Unrecognized CSV in "${filename}". Use fitness.csv (header date,calories_burned,weight,workout_completed) or health_stats.csv (date,calories_burned plus optional extra columns).`,
      ],
    };
  }

  const classified = inputs.map((input) => ({
    ...input,
    kind: detectFitnessCsvKind(input.text),
  }));

  const unknown = classified.filter((c) => c.kind === "unknown");
  if (unknown.length > 0) {
    return {
      ok: false,
      errors: unknown.map((u) => `Unrecognized CSV: "${u.filename}".`),
    };
  }

  const strict = classified.filter((c) => c.kind === "strict-fitness");
  const health = classified.filter((c) => c.kind === "health-stats");

  if (strict.length !== 1 || health.length !== 1) {
    return {
      ok: false,
      errors: [
        "Select exactly one manual fitness.csv (four-column header) and one health_stats.csv (date + calories_burned, no workout_completed).",
      ],
    };
  }

  const manualText = strict[0].text;
  const statsText = health[0].text;

  const manualParsed = parseManualFitnessCsv(manualText);
  if (!manualParsed.ok) return manualParsed;

  const statsParsed = parseHealthStatsCsv(statsText);
  if (!statsParsed.ok) return statsParsed;

  return mergeFitnessSources(manualParsed.byDate, statsParsed.maxCaloriesByDate);
}
