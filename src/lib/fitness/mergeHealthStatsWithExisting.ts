import type { FitnessDay } from "@/lib/fitness/types";
import { fitnessDaysToManualMap } from "@/lib/fitness/mergeManualWithExisting";
import { mergeFitnessSources } from "@/lib/fitness/mergeFitnessSources";
import type { MergeFitnessSourcesResult } from "@/lib/fitness/mergeFitnessSources";
import { parseHealthStatsCsv } from "@/lib/fitness/parseHealthStatsCsv";

export function mergeHealthStatsCsvWithExisting(
  healthStatsCsvText: string,
  existing: FitnessDay[],
): MergeFitnessSourcesResult {
  const stats = parseHealthStatsCsv(healthStatsCsvText);
  if (!stats.ok) return stats;
  return mergeFitnessSources(fitnessDaysToManualMap(existing), stats.maxCaloriesByDate);
}
