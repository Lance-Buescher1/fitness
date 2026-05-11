import type { InsightEngine } from "@/lib/insights/types";
import { ruleBasedInsightEngine } from "@/lib/insights/ruleBasedEngine";

export function getInsightEngine(): InsightEngine {
  return ruleBasedInsightEngine;
}
