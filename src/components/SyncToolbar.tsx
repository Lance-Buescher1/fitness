"use client";

import { useRef, useState } from "react";
import { useFileSystemAccessSupport } from "@/hooks/useFileSystemAccessSupport";

type GymFolderControls = {
  folderConnected: boolean;
  connectGymDataFolder: () => Promise<boolean>;
  disconnectGymDataFolder: () => Promise<void>;
  pickCsvFromConnectedFolder: () => Promise<File | null>;
  pickImagesFromConnectedFolder: () => Promise<File[] | null>;
};

type Props = {
  gymFolder: GymFolderControls;
  onImportCsvBundle: (files: File[], previousCount: number) => Promise<boolean>;
  onImportFitnessCsv: (file: File, previousCount: number) => Promise<boolean>;
  onImportHealthStatsCsv: (file: File, previousCount: number) => Promise<boolean>;
  onAddPhotos: (files: File[]) => Promise<void>;
  onExportFitnessCsv: () => Promise<{ ok: boolean }>;
  rowCount: number;
  message?: string | null;
  onDismissMessage?: () => void;
};

export function SyncToolbar({
  gymFolder,
  onImportCsvBundle,
  onImportFitnessCsv,
  onImportHealthStatsCsv,
  onAddPhotos,
  onExportFitnessCsv,
  rowCount,
  message,
  onDismissMessage,
}: Props) {
  const bundleCsvRef = useRef<HTMLInputElement>(null);
  const fitnessCsvRef = useRef<HTMLInputElement>(null);
  const healthCsvRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fsPickSupported = useFileSystemAccessSupport();
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const {
    folderConnected,
    connectGymDataFolder,
    disconnectGymDataFolder,
    pickCsvFromConnectedFolder,
    pickImagesFromConnectedFolder,
  } = gymFolder;

  const runFitnessImport = async (file: File | null | undefined) => {
    if (!file) return;
    await onImportFitnessCsv(file, rowCount);
  };

  const runHealthImport = async (file: File | null | undefined) => {
    if (!file) return;
    await onImportHealthStatsCsv(file, rowCount);
  };

  const runExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const result = await onExportFitnessCsv();
      if (result.ok) {
        setExportMsg(`Exported fitness.csv at ${new Date().toLocaleTimeString()}.`);
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Data sync</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Import <code className="text-zinc-400">fitness.csv</code> and{" "}
            <code className="text-zinc-400">health_stats.csv</code> separately (merged into this
            browser), or both at once. On desktop Chromium you can connect a <strong>GymData</strong>{" "}
            folder once for read/write imports and automatic <code className="text-zinc-400">fitness.csv</code>{" "}
            updates after logging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
          {fsPickSupported ? (
            <>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                onClick={() => void connectGymDataFolder()}
              >
                {folderConnected ? "Reconnect GymData folder" : "Connect GymData folder"}
              </button>
              {folderConnected ? (
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900"
                  onClick={() => void disconnectGymDataFolder()}
                >
                  Forget folder
                </button>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-3 py-2.5 text-xs text-amber-100/90">
              <p className="font-medium text-amber-50">Import on this device</p>
              <p className="mt-1 text-amber-100/80">
                iPhone browsers (Safari and Chrome) use WebKit and cannot connect a folder. Use the
                buttons below instead:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-amber-100/75">
                <li>
                  <strong>Import fitness.csv</strong> — manual logs and weight
                </li>
                <li>
                  <strong>Import health_stats.csv</strong> — calories from your fitness app
                </li>
                <li>
                  <strong>Add photos</strong> — progress pictures
                </li>
              </ul>
              <p className="mt-2 text-amber-100/70">
                After logging, tap <strong>Export fitness.csv</strong> to save an updated file to
                Files (Share → Save to Files).
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fitnessCsvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              await runFitnessImport(file ?? undefined);
            }}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={async () => {
              if (folderConnected) {
                try {
                  const file = await pickCsvFromConnectedFolder();
                  if (file) {
                    await runFitnessImport(file);
                    return;
                  }
                } catch {
                  /* permission / API — fall back to native picker */
                }
              }
              fitnessCsvRef.current?.click();
            }}
          >
            Import fitness.csv
          </button>

          <input
            ref={healthCsvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              await runHealthImport(file ?? undefined);
            }}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg bg-emerald-700/90 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
            onClick={async () => {
              if (folderConnected) {
                try {
                  const file = await pickCsvFromConnectedFolder();
                  if (file) {
                    await runHealthImport(file);
                    return;
                  }
                } catch {
                  /* permission / API — fall back to native picker */
                }
              }
              healthCsvRef.current?.click();
            }}
          >
            Import health_stats.csv
          </button>

          <input
            ref={bundleCsvRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={async (e) => {
              const picked = e.target.files ? Array.from(e.target.files) : [];
              e.target.value = "";
              if (picked.length === 0) return;
              await onImportCsvBundle(picked, rowCount);
            }}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3 py-2.5 text-sm font-medium text-emerald-100 hover:bg-emerald-950/70"
            onClick={() => bundleCsvRef.current?.click()}
          >
            Replace all (1–2 CSVs)
          </button>

          <button
            type="button"
            disabled={exporting || rowCount === 0}
            className="min-h-11 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40"
            onClick={() => void runExport()}
          >
            {exporting ? "Exporting…" : "Export fitness.csv"}
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const picked = e.target.files ? Array.from(e.target.files) : [];
              e.target.value = "";
              if (picked.length === 0) return;
              await onAddPhotos(picked);
            }}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            onClick={async () => {
              if (folderConnected) {
                try {
                  const picked = await pickImagesFromConnectedFolder();
                  if (picked?.length) {
                    await onAddPhotos(picked);
                    return;
                  }
                } catch {
                  /* permission / API — fall back to native picker */
                }
              }
              photoInputRef.current?.click();
            }}
          >
            Add photos
          </button>
        </div>

        {exportMsg ? <p className="text-xs text-zinc-400">{exportMsg}</p> : null}

        {message ? (
          <div className="flex items-start justify-between gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            <pre className="whitespace-pre-wrap font-sans">{message}</pre>
            {onDismissMessage ? (
              <button
                type="button"
                className="shrink-0 text-rose-300 hover:text-rose-100"
                onClick={onDismissMessage}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
