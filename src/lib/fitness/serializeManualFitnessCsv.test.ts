import { describe, expect, it } from "vitest";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";
import { serializeManualFitnessCsv } from "@/lib/fitness/serializeManualFitnessCsv";
import type { FitnessDay } from "@/lib/fitness/types";

describe("serializeManualFitnessCsv", () => {
  it("round-trips through parseManualFitnessCsv", () => {
    const rows: FitnessDay[] = [
      {
        date: "2026-01-02",
        caloriesBurned: 2100,
        weight: 182.5,
        workoutCompleted: true,
      },
      {
        date: "2026-01-01",
        caloriesBurned: null,
        weight: null,
        workoutCompleted: null,
      },
    ];
    const csv = serializeManualFitnessCsv(rows);
    const parsed = parseManualFitnessCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.byDate.get("2026-01-02")).toMatchObject({
      date: "2026-01-02",
      caloriesBurned: 2100,
      weight: 182.5,
      workoutCompleted: true,
    });
    expect(parsed.byDate.get("2026-01-01")).toMatchObject({
      date: "2026-01-01",
      caloriesBurned: null,
      weight: null,
      workoutCompleted: null,
    });
  });
});
