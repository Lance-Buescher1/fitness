import { describe, expect, it } from "vitest";
import { mergeManualCsvWithExistingLedger } from "@/lib/fitness/mergeManualWithExisting";
import type { FitnessDay } from "@/lib/fitness/types";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";

describe("mergeManualCsvWithExistingLedger", () => {
  it("fills blank calories from existing row", () => {
    const existing: FitnessDay[] = [
      {
        date: "2025-10-01",
        caloriesBurned: 2400,
        weight: 180,
        workoutCompleted: false,
      },
    ];
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,,181,true
`;
    const manual = parseManualFitnessCsv(csv);
    expect(manual.ok).toBe(true);
    if (!manual.ok) return;
    const r = mergeManualCsvWithExistingLedger(manual.byDate, existing);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({
      date: "2025-10-01",
      caloriesBurned: 2400,
      weight: 181,
      workoutCompleted: true,
    });
  });
});
