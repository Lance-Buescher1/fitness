"use client";

import { useCallback, useEffect, useState } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import { listFitnessRows, replaceFitnessRows } from "@/lib/db/fitnessDb";
import { mergeHealthStatsCsvWithExisting } from "@/lib/fitness/mergeHealthStatsWithExisting";
import { mergeManualCsvWithExistingLedger } from "@/lib/fitness/mergeManualWithExisting";
import { parseFitnessCsv } from "@/lib/fitness/parseCsv";
import { parseManualFitnessCsv } from "@/lib/fitness/parseManualFitnessCsv";
import { resolveFitnessCsvImport } from "@/lib/fitness/resolveFitnessCsvImport";

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

  return {
    rows,
    loading,
    error,
    setError,
    refresh,
    importCsvBundle,
    importFitnessCsvFile,
    importHealthStatsCsvFile,
  };
}
