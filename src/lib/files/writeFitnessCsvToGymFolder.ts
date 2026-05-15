import { loadGymDataDirectoryHandle } from "@/lib/db/fitnessDb";

export type WriteFitnessCsvResult =
  | { ok: true }
  | {
      ok: false;
      reason: "no_folder" | "not_supported" | "empty" | "write_failed";
      detail?: string;
    };

const FITNESS_CSV_NAME = "fitness.csv";
const FITNESS_CSV_TMP = "fitness.csv.tmp";
/** Minimum bytes for a non-empty export (header + newline). */
const MIN_CSV_BYTES = 40;

/**
 * Safely writes `fitness.csv` into the connected GymData directory.
 * Writes to a temp file first, verifies it, then overwrites `fitness.csv` in place.
 * Never deletes `fitness.csv` before the replacement content is validated.
 */
export async function writeFitnessCsvToGymFolder(csvText: string): Promise<WriteFitnessCsvResult> {
  if (typeof window === "undefined") return { ok: false, reason: "not_supported" };
  const trimmed = csvText.trim();
  if (trimmed.length < MIN_CSV_BYTES) {
    return { ok: false, reason: "empty", detail: "Nothing to export." };
  }

  const dir = await loadGymDataDirectoryHandle();
  if (!dir) return { ok: false, reason: "no_folder" };

  let tmpHandle: FileSystemFileHandle | null = null;
  try {
    tmpHandle = await dir.getFileHandle(FITNESS_CSV_TMP, { create: true });
    const tmpWritable = await tmpHandle.createWritable();
    await tmpWritable.write(csvText);
    await tmpWritable.close();

    const tmpFile = await tmpHandle.getFile();
    if (tmpFile.size < MIN_CSV_BYTES) {
      return { ok: false, reason: "empty", detail: "Export would be empty." };
    }

    const mainHandle = await dir.getFileHandle(FITNESS_CSV_NAME, { create: true });
    const mainWritable = await mainHandle.createWritable();
    await mainWritable.write(csvText);
    await mainWritable.close();

    try {
      await dir.removeEntry(FITNESS_CSV_TMP);
    } catch {
      /* temp cleanup is best-effort */
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (tmpHandle) {
      try {
        await dir.removeEntry(FITNESS_CSV_TMP);
      } catch {
        /* ignore */
      }
    }
    return { ok: false, reason: "write_failed", detail: msg };
  }
}
