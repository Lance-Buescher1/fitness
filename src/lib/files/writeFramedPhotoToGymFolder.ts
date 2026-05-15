import { loadGymDataDirectoryHandle } from "@/lib/db/fitnessDb";

export const PHOTOS_FRAMED_DIR = "PhotosFramed";

export type WriteFramedPhotoResult =
  | { ok: true }
  | { ok: false; reason: "no_folder" | "not_supported" | "write_failed"; detail?: string };

export async function getPhotosFramedDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined") return null;
  const dir = await loadGymDataDirectoryHandle();
  if (!dir) return null;
  return dir.getDirectoryHandle(PHOTOS_FRAMED_DIR, { create: true });
}

export async function writeFramedPhotoToGymFolder(
  fileName: string,
  blob: Blob,
): Promise<WriteFramedPhotoResult> {
  if (typeof window === "undefined") return { ok: false, reason: "not_supported" };
  try {
    const framedDir = await getPhotosFramedDirectory();
    if (!framedDir) return { ok: false, reason: "no_folder" };

    const safeName = fileName.replace(/[/\\]/g, "_");
    const jpegName = safeName.replace(/\.[^.]+$/i, "") + ".jpg";

    const fileHandle = await framedDir.getFileHandle(jpegName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "write_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
