import type { FitnessDay } from "@/lib/fitness/types";

export type ChartPoint = {
  date: string;
  weight: number | null;
  calories: number | null;
};

export function toChartPoints(rows: FitnessDay[]): ChartPoint[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      weight: r.weight,
      calories: r.caloriesBurned,
    }));
}
