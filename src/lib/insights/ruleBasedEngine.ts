import type { FitnessDay } from "@/lib/fitness/types";
import type { Insight, InsightContext, InsightEngine } from "@/lib/insights/types";

function averageWeight(days: FitnessDay[]): number | null {
  const ws = days.map((d) => d.weight).filter((w): w is number => w != null && Number.isFinite(w));
  if (ws.length === 0) return null;
  return ws.reduce((a, b) => a + b, 0) / ws.length;
}

function lastNDaysSorted(days: FitnessDay[], n: number): FitnessDay[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-n);
}

function avgCalories(days: FitnessDay[]): number | null {
  if (days.length === 0) return null;
  const sum = days.reduce((a, d) => a + d.caloriesBurned, 0);
  return sum / days.length;
}

export const ruleBasedInsightEngine: InsightEngine = {
  generate(context: InsightContext): Insight[] {
    const { days, calorieThreshold } = context;
    const insights: Insight[] = [];

    if (days.length === 0) {
      insights.push({
        id: "no-data",
        kind: "data",
        title: "No data yet",
        detail: "Import your fitness.csv to see trends and insights.",
        sentiment: "neutral",
      });
      return insights;
    }

    const last7 = lastNDaysSorted(days, 7);
    const prev7 = lastNDaysSorted(days, 14).slice(0, 7);

    const w7 = averageWeight(last7);
    const wPrev = averageWeight(prev7);

    if (w7 != null) {
      let sentiment: Insight["sentiment"] = "neutral";
      let detail = `Your 7-day average weight is ${w7.toFixed(1)}.`;
      if (wPrev != null) {
        const delta = w7 - wPrev;
        if (delta < -0.2) {
          sentiment = "positive";
          detail = `Your 7-day weight average is trending down (${w7.toFixed(1)} vs ${wPrev.toFixed(1)} prior week).`;
        } else if (delta > 0.2) {
          sentiment = "caution";
          detail = `Your 7-day weight average is trending up (${w7.toFixed(1)} vs ${wPrev.toFixed(1)} prior week).`;
        } else {
          detail = `Your 7-day weight average is roughly stable (${w7.toFixed(1)}; prior week ${wPrev.toFixed(1)}).`;
        }
      }
      insights.push({
        id: "weight-7d",
        kind: "weight_trend",
        title: "7-day weight",
        detail,
        sentiment,
      });
    }

    const c7 = avgCalories(last7);
    if (c7 != null) {
      const above = c7 >= calorieThreshold;
      insights.push({
        id: "calories-7d",
        kind: "calories",
        title: "Activity vs target",
        detail: above
          ? `Recent calorie burn is averaging ${Math.round(c7)} kcal, at or above your ${calorieThreshold} kcal reference.`
          : `Recent calorie burn is averaging ${Math.round(c7)} kcal, below your ${calorieThreshold} kcal reference.`,
        sentiment: above ? "positive" : "neutral",
      });
    }

    if (w7 != null && c7 != null) {
      const down = wPrev != null && w7 < wPrev - 0.1;
      const active = c7 >= calorieThreshold;
      if (down && active) {
        insights.push({
          id: "combo",
          kind: "summary",
          title: "Snapshot",
          detail: `Weight is easing down while calorie burn stays near or above ${calorieThreshold} kcal on average.`,
          sentiment: "positive",
        });
      }
    }

    return insights;
  },
};
