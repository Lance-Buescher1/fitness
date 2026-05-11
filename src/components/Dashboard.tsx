"use client";

import { useState } from "react";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { InsightsPanel } from "@/components/InsightsPanel";
import { PhotoTimeline } from "@/components/PhotoTimeline";
import { ShortcutButtons } from "@/components/ShortcutButtons";
import { SyncToolbar } from "@/components/SyncToolbar";
import { WeightCaloriesChart } from "@/components/WeightCaloriesChart";
import { useFitnessRows } from "@/hooks/useFitnessRows";
import { usePhotoGallery } from "@/hooks/usePhotoGallery";
import type { HeatmapMetric } from "@/lib/heatmap/types";

export function Dashboard() {
  const {
    rows,
    error: rowError,
    setError: setRowError,
    importCsvBundle,
    importFitnessCsvFile,
    importHealthStatsCsvFile,
  } = useFitnessRows();
  const {
    photos,
    error: photoError,
    setError: setPhotoError,
    addFromFiles,
    clearAll,
  } = usePhotoGallery();
  const [metric, setMetric] = useState<HeatmapMetric>("calories");

  const combinedError = rowError ?? photoError;

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

      <SyncToolbar
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
      />

      <HeatmapGrid rows={rows} metric={metric} onMetricChange={setMetric} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WeightCaloriesChart rows={rows} />
        <InsightsPanel rows={rows} />
      </div>

      <PhotoTimeline photos={photos} onClear={clearAll} />
    </div>
  );
}
