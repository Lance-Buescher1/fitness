"use client";

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
import { useMemo } from "react";

type Props = {
  rows: FitnessDay[];
};

export function WeightCaloriesChart({ rows }: Props) {
  const data = useMemo(() => toChartPoints(rows), [rows]);

  if (data.length === 0) {
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
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Weight and calories</h2>
      <div className="h-64 min-h-64 w-full min-w-0 sm:h-72 sm:min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
    </section>
  );
}
