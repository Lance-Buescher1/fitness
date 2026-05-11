import { describe, expect, it } from "vitest";
import { parseFitnessCsv } from "@/lib/fitness/parseCsv";

describe("parseFitnessCsv", () => {
  it("parses valid CSV", () => {
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,2450,185.5,true
2025-10-02,2100,185.2,false
`;
    const r = parseFitnessCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({
      date: "2025-10-01",
      caloriesBurned: 2450,
      weight: 185.5,
      workoutCompleted: true,
    });
    expect(r.rows[1].workoutCompleted).toBe(false);
  });

  it("rejects bad header", () => {
    const csv = `wrong,headers
2025-10-01,1,2,3`;
    const r = parseFitnessCsv(csv);
    expect(r.ok).toBe(false);
  });

  it("dedupes duplicate dates", () => {
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,100,180,true
2025-10-01,200,181,false
`;
    const r = parseFitnessCsv(csv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].caloriesBurned).toBe(200);
  });
});
