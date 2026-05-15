"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FitnessDay } from "@/lib/fitness/types";
import { toChartPoints } from "@/lib/charts/chartData";

type ViewMode = "chart" | "list";

type Props = {
  rows: FitnessDay[];
};

function formatCell(value: number | null): string {
  if (value == null) return "—";
  return String(value);
}

export function WeightCaloriesChart({ rows }: Props) {
  const [view, setView] = useState<ViewMode>("chart");
  const chartData = useMemo(() => toChartPoints(rows), [rows]);

  const listRows = useMemo(
    () =>
      [...chartData]
        .filter((r) => r.weight != null || r.calories != null)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [chartData],
  );

  if (chartData.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-100">Weight and calories</h2>
        <p className="text-sm text-zinc-500">Import CSV to chart trends.</p>
      </section>
    );
  }

  const caloriesFill = "rgba(56, 189, 248, 0.38)";
  const caloriesStroke = "rgba(14, 165, 233, 0.75)";
  const weightFill = "rgba(251, 191, 36, 0.36)";
  const weightStroke = "rgba(245, 158, 11, 0.85)";

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Weight and calories</h2>
        <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
          <button
            type="button"
            className={`min-h-11 rounded-md px-2.5 py-1.5 ${view === "chart" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
            onClick={() => setView("chart")}
          >
            Chart
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-md px-2.5 py-1.5 ${view === "list" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <div className="h-64 min-h-64 w-full min-w-0 sm:h-72 sm:min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 10 }} minTickGap={24} />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                domain={["auto", "auto"]}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                domain={[0, "auto"]}
                width={44}
              />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                labelStyle={{ color: "#e4e4e7" }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }}
                formatter={(value) => <span style={{ color: "#d4d4d8" }}>{value}</span>}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="calories"
                name="Calories (kcal)"
                fill={caloriesFill}
                stroke={caloriesStroke}
                strokeWidth={1.5}
                connectNulls={false}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                name="Weight"
                fill={weightFill}
                stroke={weightStroke}
                strokeWidth={1.5}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-800/80">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-zinc-950 text-left text-zinc-500">
              <tr>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium tabular-nums">Weight</th>
                <th className="px-2 py-2 font-medium tabular-nums">Calories</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {listRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-3 text-zinc-500">
                    No weight or calorie entries yet.
                  </td>
                </tr>
              ) : (
                listRows.map((row) => (
                  <tr key={row.date} className="border-t border-zinc-800/60">
                    <td className="whitespace-nowrap px-2 py-1.5">{row.date}</td>
                    <td className="px-2 py-1.5 tabular-nums">{formatCell(row.weight)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{formatCell(row.calories)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
