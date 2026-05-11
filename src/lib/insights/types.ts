import type { FitnessDay } from "@/lib/fitness/types";

export type InsightSentiment = "positive" | "neutral" | "caution";

export type Insight = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  sentiment?: InsightSentiment;
};

export type InsightContext = {
  days: FitnessDay[];
  calorieThreshold: number;
};

export interface InsightEngine {
  generate(context: InsightContext): Insight[];
}
