"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearGymDataDirectoryHandle,
  loadGymDataDirectoryHandle,
  saveGymDataDirectoryHandle,
} from "@/lib/db/fitnessDb";
import { openCsvPickStartedInDirectory, openImagePickStartedInDirectory } from "@/lib/files/openFromGymFolder";

export function useGymDataFolder() {
  const [folderConnected, setFolderConnected] = useState(false);

  const refreshConnected = useCallback(async () => {
    const h = await loadGymDataDirectoryHandle();
    setFolderConnected(Boolean(h));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshConnected();
    });
  }, [refreshConnected]);

  const connectGymDataFolder = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    const w = window as Window & {
      showDirectoryPicker?: (opts?: {
        mode?: "read" | "readwrite";
      }) => Promise<FileSystemDirectoryHandle>;
    };
    if (!w.showDirectoryPicker) return false;
    try {
      const handle = await w.showDirectoryPicker({ mode: "readwrite" });
      await saveGymDataDirectoryHandle(handle);
      setFolderConnected(true);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return false;
      throw e;
    }
  }, []);

  const disconnectGymDataFolder = useCallback(async () => {
    await clearGymDataDirectoryHandle();
    setFolderConnected(false);
  }, []);

  const pickCsvFromConnectedFolder = useCallback(async (): Promise<File | null> => {
    const dir = await loadGymDataDirectoryHandle();
    if (!dir) return null;
    return openCsvPickStartedInDirectory(dir);
  }, []);

  const pickImagesFromConnectedFolder = useCallback(async (): Promise<File[] | null> => {
    const dir = await loadGymDataDirectoryHandle();
    if (!dir) return null;
    return openImagePickStartedInDirectory(dir);
  }, []);

  return {
    folderConnected,
    refreshConnected,
    connectGymDataFolder,
    disconnectGymDataFolder,
    pickCsvFromConnectedFolder,
    pickImagesFromConnectedFolder,
  };
}
