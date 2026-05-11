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

export async function openImagePickStartedInDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<File[] | null> {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithFilePicker;
  if (!w.showOpenFilePicker) return null;
  try {
    const handles = await w.showOpenFilePicker({
      startIn: dir,
      multiple: true,
      types: [
        {
          description: "Images",
          accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/heic": [".heic", ".heif"],
          },
        },
      ],
    });
    if (handles.length === 0) return null;
    return await Promise.all(handles.map((h) => h.getFile()));
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}
