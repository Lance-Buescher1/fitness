import { describe, expect, it } from "vitest";
import { mergeFitnessSources } from "@/lib/fitness/mergeFitnessSources";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";
import type { FitnessDay } from "@/lib/fitness/types";

describe("fitness.csv import replace semantics", () => {
  it("uses only dates from the file when merging with empty stats", () => {
    const existing: FitnessDay[] = [
      {
        date: "2025-09-01",
        caloriesBurned: 2000,
        weight: 180,
        workoutCompleted: true,
      },
    ];
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,,181,true
`;
    const manual = parseManualFitnessCsv(csv);
    expect(manual.ok).toBe(true);
    if (!manual.ok) return;

    const replaced = mergeFitnessSources(manual.byDate, new Map());
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;

    expect(replaced.rows).toHaveLength(1);
    expect(replaced.rows[0].date).toBe("2025-10-01");
    expect(replaced.rows.find((r) => r.date === existing[0].date)).toBeUndefined();
  });
});
