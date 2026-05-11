"use client";

import { useRef } from "react";

type Props = {
  onImportCsv: (text: string, previousCount: number) => Promise<boolean>;
  onAddPhotos: (files: FileList) => Promise<void>;
  rowCount: number;
  message?: string | null;
  onDismissMessage?: () => void;
};

export function SyncToolbar({
  onImportCsv,
  onAddPhotos,
  rowCount,
  message,
  onDismissMessage,
}: Props) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Data sync</h2>
          <p className="mt-1 text-xs text-zinc-500">
            After your Shortcut updates <code className="text-zinc-400">fitness.csv</code> or saves a
            new photo in Files, return here and import. Everything stays on-device in this browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const text = await file.text();
              await onImportCsv(text, rowCount);
            }}
          />
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={() => csvInputRef.current?.click()}
          >
            Import CSV
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              e.target.value = "";
              if (!files?.length) return;
              await onAddPhotos(files);
            }}
          />
          <button
            type="button"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            onClick={() => photoInputRef.current?.click()}
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
