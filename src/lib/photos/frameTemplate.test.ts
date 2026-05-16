import { describe, expect, it } from "vitest";
import {
  cropRectFromViewportTransform,
  FRAME_VIEWPORT_ASPECT,
  templateFromViewportTransform,
  viewportTransformFromTemplate,
} from "@/lib/photos/frameTemplate";

const VW = 300;
const VH = VW / FRAME_VIEWPORT_ASPECT;

describe("frameTemplate", () => {
  it("round-trips template for portrait image", () => {
    const iw = 1200;
    const ih = 1600;
    const { scale, offset } = viewportTransformFromTemplate(iw, ih, VW, VH, {
      zoomFactor: 1.2,
      panX: 10,
      panY: -5,
    });
    const template = templateFromViewportTransform(iw, ih, VW, VH, scale, offset);
    expect(template.zoomFactor).toBeCloseTo(1.2, 5);
    expect(template.panX).toBeCloseTo(10, 5);
    expect(template.panY).toBeCloseTo(-5, 5);
  });

  it("applies same template to landscape with consistent output aspect", () => {
    const template = { zoomFactor: 1, panX: 0, panY: 0 };
    const portrait = viewportTransformFromTemplate(900, 1200, VW, VH, template);
    const landscape = viewportTransformFromTemplate(1600, 900, VW, VH, template);

    const rectP = cropRectFromViewportTransform(
      900,
      1200,
      VW,
      VH,
      portrait.scale,
      portrait.offset,
    );
    const rectL = cropRectFromViewportTransform(
      1600,
      900,
      VW,
      VH,
      landscape.scale,
      landscape.offset,
    );

    const aspectP = (rectP.width * 900) / (rectP.height * 1200);
    const aspectL = (rectL.width * 1600) / (rectL.height * 900);
    expect(aspectP).toBeCloseTo(FRAME_VIEWPORT_ASPECT, 2);
    expect(aspectL).toBeCloseTo(FRAME_VIEWPORT_ASPECT, 2);
  });
});
