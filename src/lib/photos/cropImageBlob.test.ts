import { describe, expect, it } from "vitest";
import { clampCropRectToImage } from "@/lib/photos/cropImageBlob";

describe("clampCropRectToImage", () => {
  it("clamps overflow to image bounds", () => {
    const r = clampCropRectToImage({ x: -0.1, y: 0, width: 1.5, height: 1 }, 100, 200);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(1.001);
    expect(r.y + r.height).toBeLessThanOrEqual(1.001);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
  });

  it("preserves valid interior rect", () => {
    const r = clampCropRectToImage({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 }, 400, 600);
    expect(r.x).toBeCloseTo(0.25, 5);
    expect(r.y).toBeCloseTo(0.25, 5);
    expect(r.width).toBeCloseTo(0.5, 5);
    expect(r.height).toBeCloseTo(0.5, 5);
  });
});
