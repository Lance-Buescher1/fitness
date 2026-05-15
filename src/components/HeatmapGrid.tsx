"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import {
  buildHeatmapWeekColumns,
  formatHeatmapPanelLabel,
  HEATMAP_RECENT_WEEKS,
  HEATMAP_TOTAL_WEEKS,
  HEATMAP_WEEKS_PER_PANEL,
  padFinalPanelWeeks,
  panelizeWeekColumns,
} from "@/lib/heatmap/buildCells";
import type { HeatmapCell, HeatmapMetric } from "@/lib/heatmap/types";
import { HeatmapLegend } from "@/components/HeatmapLegend";

type RangeMode = "recent" | "full";

type Props = {
  rows: FitnessDay[];
  metric: HeatmapMetric;
  onMetricChange: (m: HeatmapMetric) => void;
};

export function HeatmapGrid({ rows, metric, onMetricChange }: Props) {
  const [rangeMode, setRangeMode] = useState<RangeMode>("recent");
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowsByDate = useMemo(() => {
    const m = new Map<string, FitnessDay>();
    for (const r of rows) m.set(r.date, r);
    return m;
  }, [rows]);

  const weekColumns = useMemo(() => {
    const all = buildHeatmapWeekColumns(new Date(), rowsByDate, metric);
    if (rangeMode === "full") return all;
    return all.slice(-HEATMAP_RECENT_WEEKS);
  }, [rowsByDate, metric, rangeMode]);

  const panels = useMemo(
    () =>
      padFinalPanelWeeks(
        panelizeWeekColumns(weekColumns, HEATMAP_WEEKS_PER_PANEL),
        HEATMAP_WEEKS_PER_PANEL,
      ),
    [weekColumns],
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollToEnd = () => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    };
    scrollToEnd();
    requestAnimationFrame(scrollToEnd);
  }, [metric, rangeMode]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="relative z-10 mb-3 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">Consistency</h2>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
            <button
              type="button"
              aria-pressed={rangeMode === "recent"}
              className={`min-h-11 touch-manipulation rounded-md px-2.5 py-1.5 ${rangeMode === "recent" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => setRangeMode("recent")}
            >
              Last 12 weeks
            </button>
            <button
              type="button"
              aria-pressed={rangeMode === "full"}
              className={`min-h-11 touch-manipulation rounded-md px-2.5 py-1.5 ${rangeMode === "full" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => setRangeMode("full")}
            >
              Full history
            </button>
          </div>
          <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
            <button
              type="button"
              aria-pressed={metric === "calories"}
              className={`min-h-11 touch-manipulation rounded-md px-2.5 py-1.5 ${metric === "calories" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => onMetricChange("calories")}
            >
              Calories
            </button>
            <button
              type="button"
              aria-pressed={metric === "workout"}
              className={`min-h-11 touch-manipulation rounded-md px-2.5 py-1.5 ${metric === "workout" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
              onClick={() => onMetricChange("workout")}
            >
              Workout
            </button>
          </div>
          </div>
          <HeatmapLegend metric={metric} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-1 pb-2 touch-pan-x"
        role="region"
        aria-label="Activity heatmap, scroll horizontally; each strip is consecutive weeks with no gaps"
      >
        {panels.map((panelWeeks, panelIdx) => {
          const nWeeks = panelWeeks.length;
          const realWeeks = panelWeeks.filter((w) => !w[0]?.isPlaceholder);
          const flat = panelWeeks.flatMap((w) => w);
          const startIso = realWeeks[0]?.[0]?.isoDate ?? "";
          const lastWeek = realWeeks[realWeeks.length - 1];
          const endIso = lastWeek?.[lastWeek.length - 1]?.isoDate ?? "";
          const label = formatHeatmapPanelLabel(startIso, endIso);

          return (
            <div
              key={`${metric}-${rangeMode}-${panelIdx}-${startIso}`}
              className="flex w-[min(92vw,360px)] shrink-0 snap-start flex-col gap-1.5 sm:w-[min(85vw,400px)]"
            >
              <p className="text-center text-[11px] font-medium text-zinc-500">{label}</p>
              <div
                className="grid w-full max-w-full gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${nWeeks}, minmax(14px, 1fr))`,
                  gridAutoFlow: "column",
                  gridTemplateRows: "repeat(7, minmax(14px, 1fr))",
                  aspectRatio: `${nWeeks} / 7`,
                  minHeight: 112,
                }}
                role="img"
                aria-label={`Activity heatmap ${label}`}
              >
                {flat.map((c, i) => (
                  <HeatmapDayCell key={c.isPlaceholder ? `pad-${panelIdx}-${i}` : c.isoDate} cell={c} metric={metric} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {rangeMode === "recent" ? (
          <>
            Last {HEATMAP_RECENT_WEEKS} weeks · switch to full history for about{" "}
            {Math.round(HEATMAP_TOTAL_WEEKS / 52)} years ({HEATMAP_TOTAL_WEEKS} weeks)
          </>
        ) : (
          <>
            About {Math.round(HEATMAP_TOTAL_WEEKS / 52)} years of contiguous days ({HEATMAP_TOTAL_WEEKS}{" "}
            weeks), shown in ~{HEATMAP_WEEKS_PER_PANEL}-week strips—swipe for older months · local data only
          </>
        )}
      </p>
    </section>
  );
}

function HeatmapDayCell({ cell, metric }: { cell: HeatmapCell; metric: HeatmapMetric }) {
  if (cell.isPlaceholder) {
    return (
      <div
        aria-hidden
        className="min-h-[14px] rounded-sm bg-transparent ring-0"
      />
    );
  }

  return (
    <div
      title={
        metric === "workout"
          ? `${cell.isoDate}${
              cell.workoutCompleted == null
                ? " · workout not logged"
                : cell.workoutCompleted
                  ? " · workout day"
                  : " · rest day"
            }`
          : `${cell.isoDate}${cell.caloriesBurned != null ? ` · ${cell.caloriesBurned} kcal` : " · calories not logged"}`
      }
      className="min-h-[14px] rounded-sm ring-1 ring-zinc-800/80"
      style={{ backgroundColor: cellColor(cell.intensity, metric, cell.caloriesBurned) }}
    />
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
