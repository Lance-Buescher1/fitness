import { addDays } from "@/lib/dates/addDays";
import { formatIsoDate } from "@/lib/dates/formatIsoDate";
import { saturdayOfWeek } from "@/lib/dates/saturdayOfWeek";
import type { FitnessDay } from "@/lib/fitness/types";
import { caloriesRange, intensityForDay } from "@/lib/heatmap/heatmapScale";
import type { HeatmapCell, HeatmapMetric } from "@/lib/heatmap/types";

const WEEKS = 53;
const DOW = 7;
const TOTAL = WEEKS * DOW;

/** Column-major order (matches `grid-auto-flow: column`): each column is one week, Sun→Sat. */
export function buildHeatmapCells(
  today: Date,
  rowsByDate: Map<string, FitnessDay>,
  metric: HeatmapMetric,
): HeatmapCell[] {
  const end = saturdayOfWeek(today);
  const gridStart = addDays(end, -(TOTAL - 1));
  const allRows = Array.from(rowsByDate.values());
  const calRange = caloriesRange(allRows);

  const cells: HeatmapCell[] = [];
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DOW; row++) {
      const d = addDays(gridStart, col * DOW + row);
      const iso = formatIsoDate(d);
      const data = rowsByDate.get(iso);
      const caloriesBurned = data?.caloriesBurned ?? null;
      const workoutCompleted = data?.workoutCompleted ?? null;
      const intensity = intensityForDay(data, metric, calRange);
      cells.push({
        isoDate: iso,
        caloriesBurned,
        workoutCompleted,
        intensity,
      });
    }
  }
  return cells;
}
