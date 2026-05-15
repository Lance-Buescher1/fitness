"use client";

import { useCallback, useState } from "react";
import { DailyLogPanel } from "@/components/DailyLogPanel";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { InsightsPanel } from "@/components/InsightsPanel";
import { PhotoFrameEditor } from "@/components/PhotoFrameEditor";
import { PhotoTimeline } from "@/components/PhotoTimeline";
import { ShortcutButtons } from "@/components/ShortcutButtons";
import { SyncToolbar } from "@/components/SyncToolbar";
import { WeightCaloriesChart } from "@/components/WeightCaloriesChart";
import { useFileSystemAccessSupport } from "@/hooks/useFileSystemAccessSupport";
import { useFitnessRows } from "@/hooks/useFitnessRows";
import { useGymDataFolder } from "@/hooks/useGymDataFolder";
import { usePhotoGallery } from "@/hooks/usePhotoGallery";
import type { PhotoRecord } from "@/lib/db/types";
import type { HeatmapMetric } from "@/lib/heatmap/types";
import type { NormalizedCropRect } from "@/lib/photos/cropImageBlob";
import { photoSortKey } from "@/lib/photos/photoSortKey";

export function Dashboard() {
  const {
    rows,
    error: rowError,
    setError: setRowError,
    importCsvBundle,
    importFitnessCsvFile,
    importHealthStatsCsvFile,
    logWorkout,
    logRestDay,
    logWeight,
    exportFitnessCsvFile,
  } = useFitnessRows();
  const fsPickSupported = useFileSystemAccessSupport();
  const {
    photos,
    error: photoError,
    setError: setPhotoError,
    addFromFiles,
    loadFramedFromFiles,
    saveFramedPhoto,
    applyFrameToAll,
    pendingFrameQueue,
    clearPendingFrameQueue,
    clearAll,
  } = usePhotoGallery();
  const [metric, setMetric] = useState<HeatmapMetric>("calories");
  const [framingPhoto, setFramingPhoto] = useState<PhotoRecord | null>(null);
  const [applyAllAfterSave, setApplyAllAfterSave] = useState(false);
  const [photoFrameMsg, setPhotoFrameMsg] = useState<string | null>(null);
  const gymFolder = useGymDataFolder();

  const combinedError = rowError ?? photoError;

  const mapExportResult = (result: Awaited<ReturnType<typeof exportFitnessCsvFile>>) => ({
    ok: result.ok,
    method: result.ok ? result.method : undefined,
    detail: !result.ok ? result.detail : undefined,
  });

  const closeFrameEditor = useCallback(() => {
    setFramingPhoto(null);
    setApplyAllAfterSave(false);
  }, []);

  const handleRequestFrame = useCallback(
    (photo: PhotoRecord, options?: { applyToAllAfterSave?: boolean }) => {
      setApplyAllAfterSave(options?.applyToAllAfterSave ?? false);
      setFramingPhoto(photo);
    },
    [],
  );

  const handleSaveFrame = useCallback(
    async (rect: NormalizedCropRect) => {
      if (!framingPhoto) return;
      const warn = await saveFramedPhoto(framingPhoto, rect, gymFolder.folderConnected);
      setPhotoFrameMsg(warn);

      if (applyAllAfterSave) {
        const sorted = [...photos].sort((a, b) => {
          const ka = photoSortKey(a);
          const kb = photoSortKey(b);
          if (ka !== kb) return ka.localeCompare(kb);
          return a.fileName.localeCompare(b.fileName);
        });
        const others = sorted.filter((p) => p.id !== framingPhoto.id && !p.isFramed);
        if (others.length > 0) {
          const bulkWarn = await applyFrameToAll(rect, others, gymFolder.folderConnected);
          if (bulkWarn) setPhotoFrameMsg(bulkWarn);
        }
      }

      closeFrameEditor();
      clearPendingFrameQueue();
    },
    [
      applyAllAfterSave,
      applyFrameToAll,
      clearPendingFrameQueue,
      closeFrameEditor,
      framingPhoto,
      gymFolder.folderConnected,
      photos,
      saveFramedPhoto,
    ],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-500/90">
          Private gym stats
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Local-only lens on your CSV and progress photos. No uploads—Shortcuts write to Files, this
          app reads what you pick.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-100">Shortcuts</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Opens the Shortcuts app (leaves this page). Run after a workout or when logging weight.
        </p>
        <ShortcutButtons />
      </section>

      <DailyLogPanel
        folderConnected={gymFolder.folderConnected}
        fsPickSupported={fsPickSupported}
        onExportFitnessCsv={async () => mapExportResult(await exportFitnessCsvFile())}
        onLogWorkout={logWorkout}
        onLogRestDay={logRestDay}
        onLogWeight={logWeight}
      />

      <SyncToolbar
        gymFolder={gymFolder}
        rowCount={rows.length}
        message={combinedError}
        onDismissMessage={() => {
          setRowError(null);
          setPhotoError(null);
        }}
        onImportCsvBundle={(files, prev) => importCsvBundle(files, prev)}
        onImportFitnessCsv={(file, prev) => importFitnessCsvFile(file, prev)}
        onImportHealthStatsCsv={(file, prev) => importHealthStatsCsvFile(file, prev)}
        onAddPhotos={(files) => addFromFiles(files)}
        onLoadFramedPhotos={(files) => loadFramedFromFiles(files)}
        onExportFitnessCsv={async () => mapExportResult(await exportFitnessCsvFile())}
      />

      <HeatmapGrid rows={rows} metric={metric} onMetricChange={setMetric} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WeightCaloriesChart rows={rows} />
        <InsightsPanel rows={rows} />
      </div>

      <PhotoTimeline
        photos={photos}
        frameMsg={photoFrameMsg}
        onClear={clearAll}
        pendingFrameQueue={pendingFrameQueue}
        onDismissFrameQueue={clearPendingFrameQueue}
        onRequestFrame={handleRequestFrame}
      />

      {framingPhoto ? (
        <PhotoFrameEditor
          blob={framingPhoto.blob}
          fileName={framingPhoto.fileName}
          onCancel={() => {
            closeFrameEditor();
            clearPendingFrameQueue();
          }}
          onSave={(rect) => {
            void handleSaveFrame(rect);
          }}
        />
      ) : null}
    </div>
  );
}
