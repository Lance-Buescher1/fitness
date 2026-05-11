"use client";

import { useCallback, useEffect, useState } from "react";
import type { FitnessDay } from "@/lib/fitness/types";
import { parseFitnessCsv } from "@/lib/fitness/parseCsv";
import { listFitnessRows, replaceFitnessRows } from "@/lib/db/fitnessDb";

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

  const importCsvText = useCallback(
    async (text: string, previousCount: number): Promise<boolean> => {
      const parsed = parseFitnessCsv(text);
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

  return { rows, loading, error, setError, refresh, importCsvText };
}
