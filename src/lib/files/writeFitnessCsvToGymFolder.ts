import { loadGymDataDirectoryHandle } from "@/lib/db/fitnessDb";

export type WriteFitnessCsvResult =
  | { ok: true }
  | { ok: false; reason: "no_folder" | "not_supported" | "write_failed"; detail?: string };

/**
 * Writes `fitness.csv` into the connected GymData directory. Requires a directory handle
 * obtained with `readwrite` permission.
 */
export async function writeFitnessCsvToGymFolder(csvText: string): Promise<WriteFitnessCsvResult> {
  if (typeof window === "undefined") return { ok: false, reason: "not_supported" };
  const dir = await loadGymDataDirectoryHandle();
  if (!dir) return { ok: false, reason: "no_folder" };

  try {
    const fileHandle = await dir.getFileHandle("fitness.csv", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(csvText);
    await writable.close();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "write_failed", detail: msg };
  }
}
