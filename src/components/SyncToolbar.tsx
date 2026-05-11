"use client";

import { useEffect, useRef, useState } from "react";
import { useGymDataFolder } from "@/hooks/useGymDataFolder";

type Props = {
  onImportCsvBundle: (files: File[], previousCount: number) => Promise<boolean>;
  onImportFitnessCsv: (file: File, previousCount: number) => Promise<boolean>;
  onImportHealthStatsCsv: (file: File, previousCount: number) => Promise<boolean>;
  onAddPhotos: (files: File[]) => Promise<void>;
  rowCount: number;
  message?: string | null;
  onDismissMessage?: () => void;
};

export function SyncToolbar({
  onImportCsvBundle,
  onImportFitnessCsv,
  onImportHealthStatsCsv,
  onAddPhotos,
  rowCount,
  message,
  onDismissMessage,
}: Props) {
  const bundleCsvRef = useRef<HTMLInputElement>(null);
  const fitnessCsvRef = useRef<HTMLInputElement>(null);
  const healthCsvRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [fsPickSupported, setFsPickSupported] = useState(false);
  const {
    folderConnected,
    connectGymDataFolder,
    disconnectGymDataFolder,
    pickCsvFromConnectedFolder,
    pickImagesFromConnectedFolder,
  } = useGymDataFolder();

  useEffect(() => {
    setFsPickSupported(
      typeof window !== "undefined" &&
        "showDirectoryPicker" in window &&
        "showOpenFilePicker" in window,
    );
  }, []);

  const runFitnessImport = async (file: File | null | undefined) => {
    if (!file) return;
    await onImportFitnessCsv(file, rowCount);
  };

  const runHealthImport = async (file: File | null | undefined) => {
    if (!file) return;
    await onImportHealthStatsCsv(file, rowCount);
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Data sync</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Import <code className="text-zinc-400">fitness.csv</code> and{" "}
            <code className="text-zinc-400">health_stats.csv</code> separately (merged into this
            browser), or both at once. Connect your <strong>GymData</strong> folder once on supported
            browsers so file picks start in that folder.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
          {fsPickSupported ? (
            <>
              <button
                type="button"
                className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                onClick={() => void connectGymDataFolder()}
              >
                {folderConnected ? "Reconnect GymData folder" : "Connect GymData folder"}
              </button>
              {folderConnected ? (
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
                  onClick={() => void disconnectGymDataFolder()}
                >
                  Forget folder
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              Folder shortcuts need a browser with directory access (e.g. Chrome or Edge on desktop).
              On iPhone, use the file buttons below—the system picker cannot open a specific folder by
              default.
            </p>
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
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
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
            className="rounded-lg bg-emerald-700/90 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
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
            className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-950/70"
            onClick={() => bundleCsvRef.current?.click()}
          >
            Replace all (1–2 CSVs)
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
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
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
