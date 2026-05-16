const DEFAULT_MAX_EDGE = 1200;
const DEFAULT_QUALITY = 0.85;

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
 * Downscales images before IndexedDB storage to reduce memory and quota use.
 * Originals remain in Files (Photos/) when imported from disk.
 */
export async function resizeImageBlobForCache(
  source: Blob,
  maxEdge: number = DEFAULT_MAX_EDGE,
  quality: number = DEFAULT_QUALITY,
): Promise<Blob> {
  const img = await loadImageFromBlob(source);
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (sw <= 0 || sh <= 0) return source;

  const longest = Math.max(sw, sh);
  if (longest <= maxEdge) {
    if (source.type === "image/jpeg") return source;
    return encodeJpeg(img, sw, sh, quality);
  }

  const scale = maxEdge / longest;
  const outW = Math.round(sw * scale);
  const outH = Math.round(sh * scale);
  return encodeJpeg(img, outW, outH, quality);
}

function encodeJpeg(
  img: HTMLImageElement,
  outW: number,
  outH: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, outW, outH);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode JPEG"))),
      "image/jpeg",
      quality,
    );
  });
}
