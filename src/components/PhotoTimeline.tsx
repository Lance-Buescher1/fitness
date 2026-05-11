"use client";

import { useEffect, useMemo, useState } from "react";
import type { PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";

type Props = {
  photos: PhotoRecord[];
  onClear: () => Promise<void>;
};

export function PhotoTimeline({ photos, onClear }: Props) {
  const [urls, setUrls] = useState<Map<number, string>>(new Map());

  const sorted = useMemo(
    () => [...photos].sort((a, b) => a.fileName.localeCompare(b.fileName)),
    [photos],
  );

  useEffect(() => {
    const next = new Map<number, string>();
    for (const p of sorted) {
      if (p.id == null) continue;
      next.set(p.id, URL.createObjectURL(p.blob));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs must follow photo list updates
    setUrls(next);
    return () => {
      for (const u of next.values()) URL.revokeObjectURL(u);
    };
  }, [sorted]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Progress photos</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Stored in this browser only. Use <code className="text-zinc-400">IMG_YYYYMMDD.jpg</code>{" "}
            names when possible.
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950/50"
          onClick={() => {
            if (sorted.length === 0) return;
            if (!window.confirm("Remove all photos from this device’s app cache?")) return;
            void onClear();
          }}
        >
          Clear photo cache
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">No photos yet. Add images after each capture.</p>
      ) : (
        <ul className="flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-1">
          {sorted.map((p) => {
            const id = p.id;
            const src = id != null ? urls.get(id) : undefined;
            const label = parsePhotoIsoDateFromFileName(p.fileName) ?? p.fileName;
            return (
              <li
                key={id ?? p.fileName}
                className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
              >
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 py-1">
                  <p className="truncate text-xs text-zinc-400">{p.fileName}</p>
                  <p className="text-sm font-medium text-zinc-100">{label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
