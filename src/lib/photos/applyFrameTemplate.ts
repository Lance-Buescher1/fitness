import { cropImageBlob, type NormalizedCropRect } from "@/lib/photos/cropImageBlob";

export async function applyFrameTemplateToBlobs(
  sources: Blob[],
  rect: NormalizedCropRect,
): Promise<Blob[]> {
  return Promise.all(sources.map((blob) => cropImageBlob(blob, rect)));
}
