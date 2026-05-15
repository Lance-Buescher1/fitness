import { serializeManualFitnessCsv } from "@/lib/fitness/serializeManualFitnessCsv";
import type { FitnessDay } from "@/lib/fitness/types";

export type ExportFitnessCsvResult =
  | { ok: true; method: "share" | "download" }
  | { ok: false; reason: "cancelled" | "failed"; detail?: string };

export async function exportFitnessCsv(rows: FitnessDay[]): Promise<ExportFitnessCsvResult> {
  const csv = serializeManualFitnessCsv(rows);
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
