"use client";

import { useMemo } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import { buildHeatmapCells } from "@/lib/heatmap/buildCells";
import type { HeatmapMetric } from "@/lib/heatmap/types";
import { HeatmapLegend } from "@/components/HeatmapLegend";

type Props = {
  rows: FitnessDay[];
  metric: HeatmapMetric;
  onMetricChange: (m: HeatmapMetric) => void;
};

export function HeatmapGrid({ rows, metric, onMetricChange }: Props) {
  const rowsByDate = useMemo(() => {
    const m = new Map<string, FitnessDay>();
    for (const r of rows) m.set(r.date, r);
    return m;
  }, [rows]);

  const cells = useMemo(
    () => buildHeatmapCells(new Date(), rowsByDate, metric),
    [rowsByDate, metric],
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Consistency</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
            <button
              type="button"
              className={`rounded-md px-2 py-1 ${metric === "calories" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => onMetricChange("calories")}
            >
              Calories
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1 ${metric === "workout" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => onMetricChange("workout")}
            >
              Workout
            </button>
          </div>
          <HeatmapLegend metric={metric} />
        </div>
      </div>
      <div
        className="grid w-full max-w-full gap-1"
        style={{
          gridTemplateColumns: "repeat(53, minmax(0, 1fr))",
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          aspectRatio: "53 / 7",
        }}
        role="img"
        aria-label="Yearly activity heatmap"
      >
        {cells.map((c) => (
          <div
            key={c.isoDate}
            title={
              metric === "workout"
                ? `${c.isoDate}${
                    c.workoutCompleted == null
                      ? " · workout not logged"
                      : c.workoutCompleted
                        ? " · workout day"
                        : " · rest day"
                  }`
                : `${c.isoDate}${c.caloriesBurned != null ? ` · ${c.caloriesBurned} kcal` : " · calories not logged"}`
            }
            className="min-h-[10px] rounded-sm ring-1 ring-zinc-800/80"
            style={{ backgroundColor: cellColor(c.intensity, metric, c.caloriesBurned) }}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">Last 53 weeks · local data only</p>
    </section>
  );
}

function cellColor(intensity: number, metric: HeatmapMetric, calories: number | null): string {
  if (intensity === 0 || (metric === "calories" && calories == null)) {
    return "rgba(24, 24, 27, 0.9)";
  }
  if (metric === "workout") {
    if (intensity === 1) return "rgba(6, 78, 59, 0.45)";
    if (intensity === 3) return "rgba(82, 82, 91, 0.65)";
    return "rgba(16, 185, 129, 0.85)";
  }
  const alpha = 0.2 + (intensity / 4) * 0.75;
  return `rgba(16, 185, 129, ${alpha})`;
}
