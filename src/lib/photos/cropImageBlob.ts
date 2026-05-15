export type NormalizedCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Clamps a normalized crop rect to image bounds in pixel space, then re-normalizes. */
export function clampCropRectToImage(
  rect: NormalizedCropRect,
  imageWidth: number,
  imageHeight: number,
): NormalizedCropRect {
  let sx = rect.x * imageWidth;
  let sy = rect.y * imageHeight;
  let sw = rect.width * imageWidth;
  let sh = rect.height * imageHeight;

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

const OUTPUT_MAX = 1200;
const JPEG_QUALITY = 0.92;

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Crops a region of the source image (normalized 0–1) and returns a JPEG blob.
 */
export async function cropImageBlob(
  source: Blob,
  rect: NormalizedCropRect,
): Promise<Blob> {
  const img = await loadImageFromBlob(source);
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;

  const clamped = clampCropRectToImage(rect, sw, sh);
  const sx = Math.round(clamped.x * sw);
  const sy = Math.round(clamped.y * sh);
  const cw = Math.round(clamped.width * sw);
  const ch = Math.round(clamped.height * sh);

  let outW = cw;
  let outH = ch;
  if (outW > OUTPUT_MAX || outH > OUTPUT_MAX) {
    const scale = OUTPUT_MAX / Math.max(outW, outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode JPEG"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
