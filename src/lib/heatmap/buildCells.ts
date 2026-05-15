import { addDays } from "@/lib/dates/addDays";
import { formatIsoDate } from "@/lib/dates/formatIsoDate";
import { saturdayOfWeek } from "@/lib/dates/saturdayOfWeek";
import type { FitnessDay } from "@/lib/fitness/types";
import { caloriesRange, intensityForDay } from "@/lib/heatmap/heatmapScale";
import type { HeatmapCell, HeatmapMetric } from "@/lib/heatmap/types";

/** Full scroll range: contiguous weeks (no gaps). ~2y so every month in the last year+ is reachable. */
export const HEATMAP_TOTAL_WEEKS = 104;

/** Compact heatmap range (~3 months). */
export const HEATMAP_RECENT_WEEKS = 12;

const DOW = 7;
const TOTAL = HEATMAP_TOTAL_WEEKS * DOW;

/** ~2 months per scroll panel (tunable). */
export const HEATMAP_WEEKS_PER_PANEL = 9;

function placeholderWeekColumn(): HeatmapCell[] {
  return Array.from({ length: DOW }, () => ({
    isoDate: "",
    caloriesBurned: null,
    workoutCompleted: null,
    intensity: 0,
    isPlaceholder: true,
  }));
}

/** Column-major flat order matches `grid-auto-flow: column` (week columns, Sun→Sat). */
export function buildHeatmapCells(
  today: Date,
  rowsByDate: Map<string, FitnessDay>,
  metric: HeatmapMetric,
): HeatmapCell[] {
  return buildHeatmapWeekColumns(today, rowsByDate, metric).flatMap((week) => week);
}

/** One entry per week column (oldest → newest); each week is 7 cells Sun→Sat. */
export function buildHeatmapWeekColumns(
  today: Date,
  rowsByDate: Map<string, FitnessDay>,
  metric: HeatmapMetric,
): HeatmapCell[][] {
  const end = saturdayOfWeek(today);
  const gridStart = addDays(end, -(TOTAL - 1));
  const allRows = Array.from(rowsByDate.values());
  const calRange = caloriesRange(allRows);

  const columns: HeatmapCell[][] = [];
  for (let col = 0; col < HEATMAP_TOTAL_WEEKS; col++) {
    const week: HeatmapCell[] = [];
    for (let row = 0; row < DOW; row++) {
      const d = addDays(gridStart, col * DOW + row);
      const iso = formatIsoDate(d);
      const data = rowsByDate.get(iso);
      const caloriesBurned = data?.caloriesBurned ?? null;
      const workoutCompleted = data?.workoutCompleted ?? null;
      const intensity = intensityForDay(data, metric, calRange);
      week.push({
        isoDate: iso,
        caloriesBurned,
        workoutCompleted,
        intensity,
      });
    }
    columns.push(week);
  }
  return columns;
}

/** Split week columns into fixed-size panels (last panel may have fewer weeks). */
export function panelizeWeekColumns(
  columns: HeatmapCell[][],
  weeksPerPanel: number,
): HeatmapCell[][][] {
  if (weeksPerPanel < 1) throw new Error("weeksPerPanel must be >= 1");
  const panels: HeatmapCell[][][] = [];
  for (let i = 0; i < columns.length; i += weeksPerPanel) {
    panels.push(columns.slice(i, i + weeksPerPanel));
  }
  return panels;
}

/** Pad the final panel to a full strip width so every panel shares the same aspect ratio. */
export function padFinalPanelWeeks(
  panels: HeatmapCell[][][],
  weeksPerPanel: number,
): HeatmapCell[][][] {
  if (panels.length === 0) return panels;
  const last = panels[panels.length - 1];
  const deficit = weeksPerPanel - last.length;
  if (deficit <= 0) return panels;
  return [
    ...panels.slice(0, -1),
    [...last, ...Array.from({ length: deficit }, () => placeholderWeekColumn())],
  ];
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Short range label: explicit calendar dates so panels read as contiguous (no “missing” months). */
export function formatHeatmapPanelLabel(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return "";
  const a = parseIsoLocal(startIso);
  const b = parseIsoLocal(endIso);
  const dtf = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${dtf.format(a)} – ${dtf.format(b)}`;
}
