import type { HeatmapMetric } from "@/lib/heatmap/types";

type Props = {
  metric: HeatmapMetric;
};

export function HeatmapLegend({ metric }: Props) {
  if (metric === "workout") {
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm bg-zinc-800 ring-1 ring-zinc-700" /> No entry
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm bg-emerald-900/60 ring-1 ring-zinc-700" /> Logged
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-3 rounded-sm bg-emerald-500/80 ring-1 ring-zinc-700" /> Workout
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
      <span>Less</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((lvl) => (
          <span
            key={lvl}
            className="inline-block size-3 rounded-sm ring-1 ring-zinc-700"
            style={{ backgroundColor: calorieColor(lvl) }}
          />
        ))}
      </div>
      <span>More (calories)</span>
    </div>
  );
}

function calorieColor(level: number): string {
  const map: Record<number, string> = {
    1: "rgba(16, 185, 129, 0.25)",
    2: "rgba(16, 185, 129, 0.45)",
    3: "rgba(16, 185, 129, 0.65)",
    4: "rgba(16, 185, 129, 0.9)",
  };
  return map[level] ?? "rgba(39, 39, 42, 1)";
}
