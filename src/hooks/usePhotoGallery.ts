"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhotoRecord } from "@/lib/db/types";
import { addPhotosFromFiles, clearPhotos, listPhotos } from "@/lib/db/fitnessDb";

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPhotos();
      if (signal?.aborted) return;
      setPhotos(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Failed to load photos");
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

  const addFromFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      try {
        await addPhotosFromFiles(list);
        await refresh();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add photos");
      }
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await clearPhotos();
    await refresh();
  }, [refresh]);

  return { photos, loading, error, setError, refresh, addFromFiles, clearAll };
}
