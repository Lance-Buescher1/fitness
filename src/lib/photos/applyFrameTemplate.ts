import type { FrameViewportTemplate } from "@/lib/photos/frameTemplate";
import { applyViewportTemplateToBlobs } from "@/lib/photos/frameTemplate";

export async function applyFrameTemplateToBlobs(
  sources: Blob[],
  template: FrameViewportTemplate,
): Promise<Blob[]> {
  return applyViewportTemplateToBlobs(sources, template);
}
