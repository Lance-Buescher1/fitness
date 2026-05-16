"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhotoRecord } from "@/lib/db/types";
import {
  addPhotosFromFiles,
  clearPhotos,
  listPhotos,
  updatePhotoBlob,
} from "@/lib/db/fitnessDb";
import type { FrameViewportTemplate } from "@/lib/photos/frameTemplate";
import { applyViewportTemplateToBlob } from "@/lib/photos/frameTemplate";
import { applyFrameTemplateToBlobs } from "@/lib/photos/applyFrameTemplate";
import {
  exportFramedPhotos,
  type ExportFramedPhotosResult,
} from "@/lib/files/exportFramedPhotos";
import { writeFramedPhotoToGymFolder } from "@/lib/files/writeFramedPhotoToGymFolder";

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingFrameQueue, setPendingFrameQueue] = useState<PhotoRecord[]>([]);

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
    async (files: FileList | File[], options?: { isFramed?: boolean }) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      try {
        await addPhotosFromFiles(list, { isFramed: options?.isFramed ?? false });
        const data = await listPhotos();
        setPhotos(data);
        setError(null);
        if (!options?.isFramed) {
          const needsFrame = data.filter((p) => !p.isFramed && list.some((f) => f.name === p.fileName));
          if (needsFrame.length > 0) {
            setPendingFrameQueue(needsFrame);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add photos");
      }
    },
    [],
  );

  const loadFramedFromFiles = useCallback(async (files: FileList | File[]) => {
    await addFromFiles(files, { isFramed: true });
  }, [addFromFiles]);

  const saveFramedPhoto = useCallback(
    async (
      photo: PhotoRecord,
      template: FrameViewportTemplate,
      folderConnected: boolean,
    ): Promise<string | null> => {
      if (photo.id == null) return "Photo not found in cache.";
      const cropped = await applyViewportTemplateToBlob(photo.blob, template);
      const framedFileName = photo.fileName.replace(/\.[^.]+$/i, "") + ".jpg";

      await updatePhotoBlob(photo.id, cropped, {
        isFramed: true,
        framedFileName,
      });

      if (folderConnected) {
        const w = await writeFramedPhotoToGymFolder(framedFileName, cropped);
        if (!w.ok) {
          return `Saved in browser cache. Connect GymData folder to persist to PhotosFramed${
            w.detail ? `: ${w.detail}` : ""
          }.`;
        }
      } else {
        return "Saved in browser cache. Use Export framed photos to save to PhotosFramed on iPhone.";
      }

      await refresh();
      return null;
    },
    [refresh],
  );

  const applyFrameToAll = useCallback(
    async (
      template: FrameViewportTemplate,
      targets: PhotoRecord[],
      folderConnected: boolean,
    ): Promise<string | null> => {
      if (targets.length === 0) return null;
      const blobs = await applyFrameTemplateToBlobs(
        targets.map((p) => p.blob),
        template,
      );
      let warn: string | null = null;
      for (let i = 0; i < targets.length; i++) {
        const photo = targets[i];
        if (photo.id == null) continue;
        const cropped = blobs[i];
        const framedFileName = photo.fileName.replace(/\.[^.]+$/i, "") + ".jpg";
        await updatePhotoBlob(photo.id, cropped, { isFramed: true, framedFileName });
        if (folderConnected) {
          const w = await writeFramedPhotoToGymFolder(framedFileName, cropped);
          if (!w.ok && !warn) {
            warn = `Some framed files could not be written to PhotosFramed${
              w.detail ? `: ${w.detail}` : ""
            }.`;
          }
        }
      }
      await refresh();
      const appliedMsg = `Applied frame to ${targets.length} photo${targets.length === 1 ? "" : "s"}.`;
      if (!folderConnected) {
        const mobileNote =
          " Saved in browser cache. Use Export framed photos to save to PhotosFramed on iPhone.";
        return warn ? `${appliedMsg} ${warn}` : `${appliedMsg}${mobileNote}`;
      }
      return warn ? `${appliedMsg} ${warn}` : appliedMsg;
    },
    [refresh],
  );

  const clearPendingFrameQueue = useCallback(() => {
    setPendingFrameQueue([]);
  }, []);

  const clearAll = useCallback(async () => {
    await clearPhotos();
    setPendingFrameQueue([]);
    await refresh();
  }, [refresh]);

  const exportFramedToFiles = useCallback(
    async (folderConnected: boolean): Promise<ExportFramedPhotosResult> => {
      const data = await listPhotos();
      return exportFramedPhotos(data, folderConnected);
    },
    [],
  );

  return {
    photos,
    loading,
    error,
    setError,
    refresh,
    addFromFiles,
    loadFramedFromFiles,
    saveFramedPhoto,
    applyFrameToAll,
    pendingFrameQueue,
    clearPendingFrameQueue,
    clearAll,
    exportFramedToFiles,
  };
}
