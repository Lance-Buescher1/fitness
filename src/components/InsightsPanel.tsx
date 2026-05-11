"use client";

import { useMemo } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import { getInsightEngine } from "@/lib/insights/getInsightEngine";

const DEFAULT_CAL_THRESHOLD = 2000;

type Props = {
  rows: FitnessDay[];
};

export function InsightsPanel({ rows }: Props) {
  const insights = useMemo(() => {
    const engine = getInsightEngine();
    return engine.generate({ days: rows, calorieThreshold: DEFAULT_CAL_THRESHOLD });
  }, [rows]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Insights</h2>
      <ul className="space-y-3">
        {insights.map((i) => (
          <li
            key={i.id}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{i.title}</p>
            <p className="mt-1 text-sm text-zinc-200">{i.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
