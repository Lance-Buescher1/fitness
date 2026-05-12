import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates/addDays";
import { formatIsoDate } from "@/lib/dates/formatIsoDate";
import {
  buildHeatmapWeekColumns,
  formatHeatmapPanelLabel,
  HEATMAP_TOTAL_WEEKS,
  HEATMAP_WEEKS_PER_PANEL,
  panelizeWeekColumns,
} from "@/lib/heatmap/buildCells";
import type { FitnessDay } from "@/lib/fitness/types";

function emptyMap(): Map<string, FitnessDay> {
  return new Map();
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

describe("panelizeWeekColumns", () => {
  it("chunks columns into panels of N weeks and last panel is partial when needed", () => {
    const cols = buildHeatmapWeekColumns(new Date("2026-05-11T12:00:00"), emptyMap(), "calories");
    const panels = panelizeWeekColumns(cols, HEATMAP_WEEKS_PER_PANEL);
    expect(panels.length).toBe(Math.ceil(HEATMAP_TOTAL_WEEKS / HEATMAP_WEEKS_PER_PANEL));
    expect(panels[0].length).toBe(HEATMAP_WEEKS_PER_PANEL);
    const sumWeeks = panels.reduce((acc, p) => acc + p.length, 0);
    expect(sumWeeks).toBe(HEATMAP_TOTAL_WEEKS);
    const last = panels[panels.length - 1];
    const remainder = HEATMAP_TOTAL_WEEKS % HEATMAP_WEEKS_PER_PANEL;
    expect(last.length).toBe(remainder === 0 ? HEATMAP_WEEKS_PER_PANEL : remainder);
  });

  it("throws for invalid weeksPerPanel", () => {
    expect(() => panelizeWeekColumns([], 0)).toThrow();
  });
});

describe("buildHeatmapWeekColumns", () => {
  it("returns one column per week for the full configured range", () => {
    const fixed = new Date("2026-05-11T12:00:00");
    const cols = buildHeatmapWeekColumns(fixed, emptyMap(), "calories");
    expect(cols.length).toBe(HEATMAP_TOTAL_WEEKS);
    expect(cols.every((w) => w.length === 7)).toBe(true);
  });

  it("uses unique ISO dates across the grid", () => {
    const fixed = new Date("2026-01-15T12:00:00");
    const cols = buildHeatmapWeekColumns(fixed, emptyMap(), "workout");
    const flat = cols.flatMap((w) => w);
    expect(flat.length).toBe(HEATMAP_TOTAL_WEEKS * 7);
    expect(new Set(flat.map((c) => c.isoDate)).size).toBe(flat.length);
  });

  it("joins adjacent panels with consecutive calendar days (no skipped weeks)", () => {
    const cols = buildHeatmapWeekColumns(new Date("2026-06-01T12:00:00"), emptyMap(), "calories");
    const panels = panelizeWeekColumns(cols, HEATMAP_WEEKS_PER_PANEL);
    for (let i = 0; i < panels.length - 1; i++) {
      const lastWeek = panels[i][panels[i].length - 1];
      const lastDayIso = lastWeek[lastWeek.length - 1].isoDate;
      const firstDayNext = panels[i + 1][0][0].isoDate;
      expect(formatIsoDate(addDays(parseIsoLocal(lastDayIso), 1))).toBe(firstDayNext);
    }
  });
});

describe("formatHeatmapPanelLabel", () => {
  it("shows explicit start and end calendar dates", () => {
    expect(formatHeatmapPanelLabel("2026-03-01", "2026-03-28")).toBe("Mar 1, 2026 – Mar 28, 2026");
  });
});
