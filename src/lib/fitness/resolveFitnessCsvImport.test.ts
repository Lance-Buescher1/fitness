import { describe, expect, it } from "vitest";
import { resolveFitnessCsvImport } from "@/lib/fitness/resolveFitnessCsvImport";

const manual = `date,calories_burned,weight,workout_completed
2025-10-01,,185.5,true
`;

const stats = `date,calories_burned
2025-10-01,2450
2025-10-01,2600
`;

describe("resolveFitnessCsvImport", () => {
  it("imports single strict fitness.csv", () => {
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,2450,185.5,true
`;
    const r = resolveFitnessCsvImport([{ filename: "fitness.csv", text: csv }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].caloriesBurned).toBe(2450);
  });

  it("imports health_stats.csv alone", () => {
    const r = resolveFitnessCsvImport([{ filename: "health_stats.csv", text: stats }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].date).toBe("2025-10-01");
    expect(r.rows[0].caloriesBurned).toBe(2600);
    expect(r.rows[0].weight).toBeNull();
    expect(r.rows[0].workoutCompleted).toBe(false);
  });

  it("merges manual + health_stats (stats wins calories; manual keeps weight)", () => {
    const r = resolveFitnessCsvImport([
      { filename: "fitness.csv", text: manual },
      { filename: "health_stats.csv", text: stats },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]).toMatchObject({
      date: "2025-10-01",
      caloriesBurned: 2600,
      weight: 185.5,
      workoutCompleted: true,
    });
  });

  it("prefers stats calories over manual when both set", () => {
    const manualWithCal = `date,calories_burned,weight,workout_completed
2025-10-01,100,180,false
`;
    const r = resolveFitnessCsvImport([
      { filename: "fitness.csv", text: manualWithCal },
      { filename: "health_stats.csv", text: stats },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].caloriesBurned).toBe(2600);
    expect(r.rows[0].weight).toBe(180);
  });

  it("rejects two fitness-style files", () => {
    const csv = `date,calories_burned,weight,workout_completed
2025-10-01,1,,false
`;
    const r = resolveFitnessCsvImport([
      { filename: "a.csv", text: csv },
      { filename: "b.csv", text: csv },
    ]);
    expect(r.ok).toBe(false);
  });

  it("errors when manual row has no calories and stats omit that date", () => {
    const manualOnly = `date,calories_burned,weight,workout_completed
2025-10-02,,180,true
`;
    const r = resolveFitnessCsvImport([
      { filename: "fitness.csv", text: manualOnly },
      { filename: "health_stats.csv", text: stats },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.includes("2025-10-02"))).toBe(true);
  });

  it("allows extra columns on health_stats", () => {
    const withSteps = `date,calories_burned,steps
2025-10-03,2000,10000
`;
    const r = resolveFitnessCsvImport([{ filename: "health_stats.csv", text: withSteps }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0].caloriesBurned).toBe(2000);
  });
});
