import {
  cropImageBlob,
  type NormalizedCropRect,
} from "@/lib/photos/cropImageBlob";

export const FRAME_VIEWPORT_ASPECT = 3 / 4;

/** Pan/zoom relative to cover-fit in the 3:4 frame editor viewport. */
export type FrameViewportTemplate = {
  zoomFactor: number;
  panX: number;
  panY: number;
};

export function coverScaleForImage(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  return Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
}

export function coverOffsetForImage(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
): { x: number; y: number } {
  return {
    x: (viewportWidth - imageWidth * scale) / 2,
    y: (viewportHeight - imageHeight * scale) / 2,
  };
}

export function viewportTransformFromTemplate(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  template: FrameViewportTemplate,
): { scale: number; offset: { x: number; y: number } } {
  const cover = coverScaleForImage(imageWidth, imageHeight, viewportWidth, viewportHeight);
  const coverOffset = coverOffsetForImage(
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight,
    cover,
  );
  const scale = cover * template.zoomFactor;
  return {
    scale,
    offset: {
      x: coverOffset.x + template.panX,
      y: coverOffset.y + template.panY,
    },
  };
}

export function cropRectFromViewportTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
  offset: { x: number; y: number },
): NormalizedCropRect {
  let sx = -offset.x / scale;
  let sy = -offset.y / scale;
  let sw = viewportWidth / scale;
  let sh = viewportHeight / scale;

  sx = Math.max(0, Math.min(imageWidth - 1, sx));
  sy = Math.max(0, Math.min(imageHeight - 1, sy));
  sw = Math.max(1, Math.min(imageWidth - sx, sw));
  sh = Math.max(1, Math.min(imageHeight - sy, sh));

  return {
    x: sx / imageWidth,
    y: sy / imageHeight,
    width: sw / imageWidth,
    height: sh / imageHeight,
  };
}

export function templateFromViewportTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
  offset: { x: number; y: number },
): FrameViewportTemplate {
  const cover = coverScaleForImage(imageWidth, imageHeight, viewportWidth, viewportHeight);
  const coverOffset = coverOffsetForImage(
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight,
    cover,
  );
  const zoomFactor = cover > 0 ? scale / cover : 1;
  return {
    zoomFactor,
    panX: offset.x - coverOffset.x,
    panY: offset.y - coverOffset.y,
  };
}

export async function applyViewportTemplateToBlob(
  source: Blob,
  template: FrameViewportTemplate,
  viewportAspect: number = FRAME_VIEWPORT_ASPECT,
): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load image"));
      el.src = url;
    });
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const viewportWidth = 400;
    const viewportHeight = viewportWidth / viewportAspect;
    const { scale, offset } = viewportTransformFromTemplate(
      iw,
      ih,
      viewportWidth,
      viewportHeight,
      template,
    );
    const rect = cropRectFromViewportTransform(iw, ih, viewportWidth, viewportHeight, scale, offset);
    return cropImageBlob(source, rect);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function applyViewportTemplateToBlobs(
  sources: Blob[],
  template: FrameViewportTemplate,
): Promise<Blob[]> {
  return Promise.all(sources.map((blob) => applyViewportTemplateToBlob(blob, template)));
}
