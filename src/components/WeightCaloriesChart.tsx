"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Weight and calories</h2>
      <div className="h-72 w-full min-w-0">
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
            />
            <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="calories"
              name="Calories (kcal)"
              fill="rgba(59, 130, 246, 0.25)"
              stroke="rgba(59, 130, 246, 0.35)"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              name="Weight"
              stroke="#f4f4f5"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
