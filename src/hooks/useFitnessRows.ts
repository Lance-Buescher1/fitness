"use client";

import { useCallback, useEffect, useState } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import {
  listFitnessRows,
  replaceFitnessRows,
  upsertFitnessDayMerge,
} from "@/lib/db/fitnessDb";
import { mergeHealthStatsCsvWithExisting } from "@/lib/fitness/mergeHealthStatsWithExisting";
import { mergeManualCsvWithExistingLedger } from "@/lib/fitness/mergeManualWithExisting";
import { parseFitnessCsv } from "@/lib/fitness/parseCsv";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";
import { resolveFitnessCsvImport } from "@/lib/fitness/resolveFitnessCsvImport";
import { serializeManualFitnessCsv } from "@/lib/fitness/serializeManualFitnessCsv";
import {
  exportFitnessCsv,
  type ExportFitnessCsvResult,
} from "@/lib/files/exportFitnessCsv";
import { writeFitnessCsvToGymFolder } from "@/lib/files/writeFitnessCsvToGymFolder";

export function useFitnessRows() {
  const [rows, setRows] = useState<FitnessDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listFitnessRows();
      if (signal?.aborted) return;
      setRows(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Failed to load fitness data");
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  const reloadRowsQuiet = useCallback(async () => {
    try {
      const data = await listFitnessRows();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fitness data");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    queueMicrotask(() => {
      void refresh(ac.signal);
    });
    return () => ac.abort();
  }, [refresh]);

  const commitImportedRows = useCallback(
    async (parsed: { ok: true; rows: FitnessDay[] } | { ok: false; errors: string[] }, previousCount: number) => {
      if (!parsed.ok) {
        setError(parsed.errors.join("\n"));
        return false;
      }
      if (parsed.rows.length + 5 < previousCount) {
        const ok = window.confirm(
          `The new file has many fewer rows (${parsed.rows.length}) than before (${previousCount}). Replace local data anyway?`,
        );
        if (!ok) return false;
      }
      await replaceFitnessRows(parsed.rows);
      await refresh();
      setError(null);
      return true;
    },
    [refresh],
  );

  const importCsvBundle = useCallback(
    async (files: File[], previousCount: number): Promise<boolean> => {
      if (files.length === 0) return false;
      const inputs = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          text: await file.text(),
        })),
      );
      const parsed = resolveFitnessCsvImport(inputs);
      return commitImportedRows(parsed, previousCount);
    },
    [commitImportedRows],
  );

  const importFitnessCsvFile = useCallback(
    async (file: File, previousCount: number): Promise<boolean> => {
      const text = await file.text();
      const manual = parseManualFitnessCsv(text);
      if (!manual.ok) {
        const strict = parseFitnessCsv(text);
        if (!strict.ok) {
          setError([...manual.errors, ...strict.errors].join("\n"));
          return false;
        }
        return commitImportedRows(strict, previousCount);
      }
      const existing = await listFitnessRows();
      const merged = mergeManualCsvWithExistingLedger(manual.byDate, existing);
      return commitImportedRows(merged, previousCount);
    },
    [commitImportedRows],
  );

  const importHealthStatsCsvFile = useCallback(
    async (file: File, previousCount: number): Promise<boolean> => {
      const text = await file.text();
      const existing = await listFitnessRows();
      const merged = mergeHealthStatsCsvWithExisting(text, existing);
      return commitImportedRows(merged, previousCount);
    },
    [commitImportedRows],
  );

  const syncFitnessCsvToGymFolder = useCallback(async (): Promise<void> => {
    const data = await listFitnessRows();
    const csv = serializeManualFitnessCsv(data);
    const w = await writeFitnessCsvToGymFolder(csv);
    if (!w.ok && w.reason === "write_failed") {
      setError(
        `Saved locally but could not write fitness.csv to your GymData folder${
          w.detail ? `: ${w.detail}` : ""
        }. Try reconnecting the folder (read/write permission).`,
      );
    }
  }, []);

  const logWorkout = useCallback(
    async (date: string, caloriesBurned?: number | null): Promise<void> => {
      setError(null);
      const patch: Parameters<typeof upsertFitnessDayMerge>[1] = { workoutCompleted: true };
      if (caloriesBurned != null && Number.isFinite(caloriesBurned) && caloriesBurned >= 0) {
        patch.caloriesBurned = caloriesBurned;
      }
      await upsertFitnessDayMerge(date, patch);
      await reloadRowsQuiet();
      await syncFitnessCsvToGymFolder();
    },
    [reloadRowsQuiet, syncFitnessCsvToGymFolder],
  );

  const logRestDay = useCallback(
    async (date: string): Promise<void> => {
      setError(null);
      await upsertFitnessDayMerge(date, { workoutCompleted: false });
      await reloadRowsQuiet();
      await syncFitnessCsvToGymFolder();
    },
    [reloadRowsQuiet, syncFitnessCsvToGymFolder],
  );

  const logWeight = useCallback(
    async (date: string, weight: number): Promise<void> => {
      setError(null);
      if (!Number.isFinite(weight) || weight <= 0) {
        setError("Weight must be a positive number.");
        return;
      }
      await upsertFitnessDayMerge(date, { weight });
      await reloadRowsQuiet();
      await syncFitnessCsvToGymFolder();
    },
    [reloadRowsQuiet, syncFitnessCsvToGymFolder],
  );

  const exportFitnessCsvFile = useCallback(async (): Promise<ExportFitnessCsvResult> => {
    const data = await listFitnessRows();
    return exportFitnessCsv(data);
  }, []);

  return {
    rows,
    loading,
    error,
    setError,
    refresh,
    importCsvBundle,
    importFitnessCsvFile,
    importHealthStatsCsvFile,
    logWorkout,
    logRestDay,
    logWeight,
    exportFitnessCsvFile,
  };
}
