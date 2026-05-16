import type { PhotoRecord } from "@/lib/db/types";
import { writeFramedPhotoToGymFolder } from "@/lib/files/writeFramedPhotoToGymFolder";

export type ExportFramedPhotosResult =
  | { ok: true; method: "folder"; count: number }
  | { ok: true; method: "share"; count: number }
  | { ok: true; method: "download"; count: number }
  | { ok: false; reason: "empty" | "cancelled" | "failed"; detail?: string };

const SHARE_CHUNK_SIZE = 10;

function framedFileNameFor(photo: PhotoRecord): string {
  if (photo.framedFileName) return photo.framedFileName;
  return photo.fileName.replace(/\.[^.]+$/i, "") + ".jpg";
}

function photoToFile(photo: PhotoRecord): File {
  const name = framedFileNameFor(photo);
  return new File([photo.blob], name, { type: photo.blob.type || "image/jpeg" });
}

async function shareFiles(files: File[]): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }
  if (!navigator.canShare({ files })) return false;
  try {
    await navigator.share({ files, title: "Framed photos" });
    return true;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name === "AbortError") throw err;
    return false;
  }
}

async function downloadFiles(files: File[]): Promise<void> {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export async function exportFramedPhotos(
  photos: PhotoRecord[],
  folderConnected: boolean,
): Promise<ExportFramedPhotosResult> {
  const framed = photos.filter((p) => p.isFramed && p.blob.size > 0);
  if (framed.length === 0) {
    return { ok: false, reason: "empty", detail: "No framed photos in cache to export." };
  }

  if (folderConnected) {
    let written = 0;
    let firstError: string | undefined;
    for (const photo of framed) {
      const name = framedFileNameFor(photo);
      const w = await writeFramedPhotoToGymFolder(name, photo.blob);
      if (w.ok) written++;
      else if (!firstError) firstError = w.detail;
    }
    if (written > 0) {
      return { ok: true, method: "folder", count: written };
    }
    return {
      ok: false,
      reason: "failed",
      detail: firstError ?? "Could not write to PhotosFramed.",
    };
  }

  const files = framed.map(photoToFile);

  try {
    if (files.length <= SHARE_CHUNK_SIZE) {
      const shared = await shareFiles(files);
      if (shared) return { ok: true, method: "share", count: files.length };
    } else {
      let sharedCount = 0;
      for (let i = 0; i < files.length; i += SHARE_CHUNK_SIZE) {
        const chunk = files.slice(i, i + SHARE_CHUNK_SIZE);
        const shared = await shareFiles(chunk);
        if (!shared) break;
        sharedCount += chunk.length;
      }
      if (sharedCount > 0) {
        return { ok: true, method: "share", count: sharedCount };
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
  }

  try {
    await downloadFiles(files);
    return { ok: true, method: "download", count: files.length };
  } catch (e) {
    return {
      ok: false,
      reason: "failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
