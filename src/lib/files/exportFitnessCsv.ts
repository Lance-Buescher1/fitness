import { serializeManualFitnessCsv } from "@/lib/fitness/serializeManualFitnessCsv";
import type { FitnessDay } from "@/lib/fitness/types";
import { writeFitnessCsvToGymFolder } from "@/lib/files/writeFitnessCsvToGymFolder";

export type ExportFitnessCsvResult =
  | { ok: true; method: "folder" | "share" | "download" }
  | { ok: false; reason: "cancelled" | "empty" | "failed"; detail?: string };

export async function exportFitnessCsv(rows: FitnessDay[]): Promise<ExportFitnessCsvResult> {
  if (rows.length === 0) {
    return { ok: false, reason: "empty", detail: "No fitness data to export." };
  }

  const csv = serializeManualFitnessCsv(rows);

  const folderWrite = await writeFitnessCsvToGymFolder(csv);
  if (folderWrite.ok) {
    return { ok: true, method: "folder" };
  }
  if (folderWrite.reason === "empty") {
    return { ok: false, reason: "empty", detail: folderWrite.detail };
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const file = new File([blob], "fitness.csv", { type: "text/csv" });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: "fitness.csv" });
      return { ok: true, method: "share" };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === "AbortError") {
        return { ok: false, reason: "cancelled" };
      }
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitness.csv";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true, method: "download" };
  } catch (e) {
    return {
      ok: false,
      reason: "failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
