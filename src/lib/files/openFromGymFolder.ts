import { PHOTOS_FRAMED_DIR } from "@/lib/files/writeFramedPhotoToGymFolder";

const IMAGE_PICK_TYPES: { description: string; accept: Record<string, string[]> }[] = [
  {
    description: "Images",
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic", ".heif"],
    },
  },
];

/**
 * File picker opened in a previously chosen directory (Chromium / some Safari).
 * Returns null if unsupported, user cancels, or picker fails.
 */
type WindowWithFilePicker = Window & {
  showOpenFilePicker?: (options: {
    startIn?: FileSystemDirectoryHandle;
    multiple?: boolean;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle[]>;
};

async function pickImagesInDirectory(
  dir: FileSystemDirectoryHandle,
  multiple: boolean,
): Promise<File[] | null> {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithFilePicker;
  if (!w.showOpenFilePicker) return null;
  try {
    const handles = await w.showOpenFilePicker({
      startIn: dir,
      multiple,
      types: IMAGE_PICK_TYPES,
    });
    if (handles.length === 0) return null;
    return await Promise.all(handles.map((h) => h.getFile()));
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}

export async function openCsvPickStartedInDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<File | null> {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithFilePicker;
  if (!w.showOpenFilePicker) return null;
  try {
    const handles = await w.showOpenFilePicker({
      startIn: dir,
      multiple: false,
      types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
    });
    const h = handles[0];
    if (!h) return null;
    return await h.getFile();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}

export async function openPhotosPickStartedInDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<File[] | null> {
  try {
    const photosDir = await dir.getDirectoryHandle("Photos", { create: false });
    return pickImagesInDirectory(photosDir, true);
  } catch {
    return pickImagesInDirectory(dir, true);
  }
}

export async function openImagePickStartedInDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<File[] | null> {
  return pickImagesInDirectory(dir, true);
}

export async function openFramedImagePickStartedInDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<File[] | null> {
  try {
    const framedDir = await dir.getDirectoryHandle(PHOTOS_FRAMED_DIR, { create: false });
    return pickImagesInDirectory(framedDir, true);
  } catch {
    return null;
  }
}
