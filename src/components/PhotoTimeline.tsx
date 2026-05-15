"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";

type Props = {
  photos: PhotoRecord[];
  onClear: () => Promise<void>;
};

type ViewMode = "single" | "compare" | "strip";

function objectUrlKey(p: PhotoRecord): string {
  return p.id != null ? `id:${p.id}` : `fn:${p.fileName}:${p.takenAt}`;
}

export function PhotoTimeline({ photos, onClear }: Props) {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [dataUrlFallback, setDataUrlFallback] = useState<Map<string, string>>(new Map());
  const dataUrlAttempted = useRef(new Set<string>());

  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [activeIndex, setActiveIndex] = useState(0);
  const [referenceKey, setReferenceKey] = useState<string | null>(null);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(() => new Set());

  const sorted = useMemo(
    () => [...photos].sort((a, b) => a.fileName.localeCompare(b.fileName)),
    [photos],
  );

  const photoBlobFingerprint = useMemo(
    () => sorted.map((p) => `${objectUrlKey(p)}|${p.blob.size}|${p.takenAt}`).join("¦"),
    [sorted],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- object URL lifecycle tied to blob identity; cleanup revokes */
  useLayoutEffect(() => {
    dataUrlAttempted.current.clear();
    setDataUrlFallback(new Map());
    setLoadedKeys(new Set());
    const next = new Map<string, string>();
    for (const p of sorted) {
      next.set(objectUrlKey(p), URL.createObjectURL(p.blob));
    }
    setUrls(next);
    return () => {
      for (const u of next.values()) URL.revokeObjectURL(u);
    };
  }, [photoBlobFingerprint, sorted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (referenceKey == null) return;
    if (!sorted.some((p) => objectUrlKey(p) === referenceKey)) {
      queueMicrotask(() => setReferenceKey(null));
    }
  }, [sorted, referenceKey]);

  const markLoaded = useCallback((key: string) => {
    setLoadedKeys((prev) => {
      if (prev.has(key)) return prev;
      const n = new Set(prev);
      n.add(key);
      return n;
    });
  }, []);

  const resolveSrc = useCallback(
    (key: string) => dataUrlFallback.get(key) ?? urls.get(key) ?? null,
    [dataUrlFallback, urls],
  );

  const safeActiveIndex = sorted.length === 0 ? 0 : Math.min(activeIndex, sorted.length - 1);

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error("read failed"));
      reader.readAsDataURL(blob);
    });

  const handleImgError = useCallback(
    (key: string, blob: Blob) => {
      if (dataUrlAttempted.current.has(key)) return;
      dataUrlAttempted.current.add(key);
      void (async () => {
        try {
          const dataUrl = await blobToDataUrl(blob);
          setDataUrlFallback((prev) => {
            if (prev.has(key)) return prev;
            return new Map(prev).set(key, dataUrl);
          });
        } catch {
          dataUrlAttempted.current.delete(key);
        }
      })();
    },
    [],
  );

  useEffect(() => {
    if (viewMode === "strip" || sorted.length === 0) return;
    const warm = (i: number) => {
      const p = sorted[i];
      if (!p) return;
      const key = objectUrlKey(p);
      const src = resolveSrc(key);
      if (!src) return;
      const img = new Image();
      img.src = src;
      const d = img.decode?.();
      if (d) void d.catch(() => {});
    };
    warm(safeActiveIndex);
    warm(safeActiveIndex + 1);
  }, [safeActiveIndex, sorted, resolveSrc, viewMode, photoBlobFingerprint]);

  const latestPhoto = sorted.length ? sorted[sorted.length - 1] : null;
  const referencePhoto = referenceKey
    ? sorted.find((p) => objectUrlKey(p) === referenceKey) ?? null
    : null;
  const activePhoto = sorted.length ? sorted[safeActiveIndex] : null;

  const modeButtons = (
    <div className="flex rounded-lg border border-zinc-800 p-0.5 text-xs">
      {(
        [
          ["single", "Single"],
          ["compare", "Compare"],
          ["strip", "Strip"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`min-h-11 rounded-md px-2.5 py-1.5 ${viewMode === id ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"}`}
          onClick={() => setViewMode(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );

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
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {sorted.length > 0 ? modeButtons : null}
          <button
            type="button"
            className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950/50 sm:self-start"
            onClick={() => {
              if (sorted.length === 0) return;
              if (!window.confirm("Remove all photos from this device’s app cache?")) return;
              void onClear();
            }}
          >
            Clear photo cache
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">No photos yet. Add images after each capture.</p>
      ) : viewMode === "strip" ? (
        <StripView sorted={sorted} resolveSrc={resolveSrc} loadedKeys={loadedKeys} markLoaded={markLoaded} onImgError={handleImgError} />
      ) : (
        <div className="flex min-h-0 flex-col gap-3">
          {viewMode === "single" && activePhoto ? (
            <HeroBlock
              photo={activePhoto}
              resolveSrc={resolveSrc}
              loadedKeys={loadedKeys}
              markLoaded={markLoaded}
              onImgError={handleImgError}
            />
          ) : null}

          {viewMode === "compare" && latestPhoto ? (
            <div className="flex min-h-0 flex-col gap-3">
              <div className="grid min-h-0 grid-cols-2 gap-2">
                <div className="flex min-h-0 flex-col gap-1">
                  <p className="text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Reference
                  </p>
                  {referencePhoto ? (
                    <HeroBlock
                      variant="compare"
                      photo={referencePhoto}
                      resolveSrc={resolveSrc}
                      loadedKeys={loadedKeys}
                      markLoaded={markLoaded}
                      onImgError={handleImgError}
                    />
                  ) : (
                    <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 px-2 py-4 text-center">
                      <p className="text-[10px] leading-snug text-zinc-400">
                        Pick a photo in the strip, then tap <span className="text-zinc-200">Set reference</span>.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex min-h-0 flex-col gap-1">
                  <p className="text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Latest
                  </p>
                  <HeroBlock
                    variant="compare"
                    photo={latestPhoto}
                    resolveSrc={resolveSrc}
                    loadedKeys={loadedKeys}
                    markLoaded={markLoaded}
                    onImgError={handleImgError}
                  />
                </div>
              </div>
              {activePhoto ? (
                <div className="flex justify-center px-0.5">
                  <button
                    type="button"
                    className="min-h-11 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 sm:w-auto sm:py-1.5"
                    onClick={() => setReferenceKey(objectUrlKey(activePhoto))}
                  >
                    Set reference to current strip photo
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {viewMode === "single" && sorted.length > 1 ? (
            <PhotoScrubber
              count={sorted.length}
              activeIndex={safeActiveIndex}
              onChangeIndex={setActiveIndex}
            />
          ) : null}

          <Filmstrip
            sorted={sorted}
            activeIndex={safeActiveIndex}
            onSelectIndex={setActiveIndex}
            resolveSrc={resolveSrc}
            loadedKeys={loadedKeys}
            markLoaded={markLoaded}
            onImgError={handleImgError}
            compareMode={viewMode === "compare"}
            referenceKey={referenceKey}
          />
        </div>
      )}
    </section>
  );
}

function HeroBlock({
  variant = "default",
  photo,
  resolveSrc,
  loadedKeys,
  markLoaded,
  onImgError,
}: {
  variant?: "default" | "compare";
  photo: PhotoRecord;
  resolveSrc: (key: string) => string | null;
  loadedKeys: Set<string>;
  markLoaded: (key: string) => void;
  onImgError: (key: string, blob: Blob) => void;
}) {
  const key = objectUrlKey(photo);
  const src = resolveSrc(key);
  const label = parsePhotoIsoDateFromFileName(photo.fileName) ?? photo.fileName;
  const ready = loadedKeys.has(key);
  const isCompare = variant === "compare";

  return (
    <div className="flex min-h-0 flex-col gap-1">
      <div
        className={`relative w-full overflow-y-auto overflow-x-hidden rounded-lg bg-zinc-900/60 ${
          isCompare
            ? "max-h-[min(42vh,18rem)] min-h-[8rem]"
            : "max-h-[min(72vh,36rem)] min-h-[12rem]"
        }`}
      >
        <div
          className={`relative flex w-full items-start justify-center ${
            isCompare ? "min-h-[8rem] p-1" : "min-h-[12rem] p-2 sm:min-h-[14rem]"
          }`}
        >
          {src && !ready ? (
            <div
              className="absolute inset-0 animate-pulse bg-zinc-800"
              aria-hidden
            />
          ) : null}
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className={`h-auto w-auto max-w-full object-contain object-top ${
                isCompare ? "max-h-[min(40vh,17rem)]" : "max-h-[min(70vh,34rem)]"
              } ${ready ? "opacity-100" : "opacity-0"}`}
              onLoad={() => markLoaded(key)}
              onError={() => onImgError(key, photo.blob)}
            />
          ) : null}
        </div>
      </div>
      <div className="space-y-0.5 px-1 text-center">
        <p className="text-xs font-medium text-zinc-200">{label}</p>
        <p className="truncate text-[11px] text-zinc-500">{photo.fileName}</p>
      </div>
    </div>
  );
}

function PhotoScrubber({
  count,
  activeIndex,
  onChangeIndex,
}: {
  count: number;
  activeIndex: number;
  onChangeIndex: (i: number) => void;
}) {
  const max = Math.max(0, count - 1);
  return (
    <div className="space-y-1 px-0.5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500">
        <span>Scroll photos</span>
        <span>
          {activeIndex + 1} / {count}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={activeIndex}
        aria-label="Choose photo index"
        className="h-3 w-full cursor-pointer accent-emerald-500"
        onChange={(e) => onChangeIndex(Number(e.target.value))}
      />
    </div>
  );
}

function Filmstrip({
  sorted,
  activeIndex,
  onSelectIndex,
  resolveSrc,
  loadedKeys,
  markLoaded,
  onImgError,
  compareMode,
  referenceKey,
}: {
  sorted: PhotoRecord[];
  activeIndex: number;
  onSelectIndex: (i: number) => void;
  resolveSrc: (key: string) => string | null;
  loadedKeys: Set<string>;
  markLoaded: (key: string) => void;
  onImgError: (key: string, blob: Blob) => void;
  compareMode: boolean;
  referenceKey: string | null;
}) {
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, sorted]);

  return (
    <div className="w-full overflow-x-scroll overflow-y-hidden pb-2 [scrollbar-color:rgba(113,113,122,0.9)_transparent] [scrollbar-width:auto]">
      <ul className="flex w-max snap-x snap-mandatory gap-2 pr-1">
        {sorted.map((p, i) => {
          const key = objectUrlKey(p);
          const src = resolveSrc(key);
          const isNextSlot = i === activeIndex + 1;
          const showNextSkeleton = isNextSlot && src != null && !loadedKeys.has(key);
          const isRef = compareMode && referenceKey === key;
          return (
            <li key={key} className="snap-start">
              <button
                ref={i === activeIndex ? activeThumbRef : undefined}
                type="button"
                onClick={() => onSelectIndex(i)}
                className={`relative flex h-20 w-14 shrink-0 flex-col overflow-hidden rounded-md border bg-zinc-800 ring-offset-2 ring-offset-zinc-950 ${
                  i === activeIndex ? "border-emerald-500 ring-2 ring-emerald-500/60" : "border-zinc-700"
                } ${isRef ? "ring-2 ring-amber-500/70" : ""}`}
                aria-label={`Photo ${i + 1}${isRef ? ", reference" : ""}`}
              >
                {src && !loadedKeys.has(key) ? (
                  <div className="absolute inset-0 animate-pulse bg-zinc-700" aria-hidden />
                ) : null}
                {showNextSkeleton ? (
                  <div
                    className="pointer-events-none absolute inset-0 border-2 border-dashed border-zinc-500/50 bg-zinc-900/20"
                    aria-hidden
                    title="Loading next"
                  />
                ) : null}
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className={`h-full w-full object-cover ${loadedKeys.has(key) ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => markLoaded(key)}
                    onError={() => onImgError(key, p.blob)}
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StripView({
  sorted,
  resolveSrc,
  loadedKeys,
  markLoaded,
  onImgError,
}: {
  sorted: PhotoRecord[];
  resolveSrc: (key: string) => string | null;
  loadedKeys: Set<string>;
  markLoaded: (key: string) => void;
  onImgError: (key: string, blob: Blob) => void;
}) {
  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-width:thin]">
      <ul className="flex w-max gap-3 pr-1">
        {sorted.map((p) => {
          const key = objectUrlKey(p);
          const src = resolveSrc(key);
          const label = parsePhotoIsoDateFromFileName(p.fileName) ?? p.fileName;
          const ready = loadedKeys.has(key);
          return (
            <li
              key={key}
              className="flex w-52 shrink-0 flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-zinc-800">
                {src && !ready ? (
                  <div className="absolute inset-0 animate-pulse bg-zinc-700" aria-hidden />
                ) : null}
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className={`h-full w-full object-cover ${ready ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => markLoaded(key)}
                    onError={() => onImgError(key, p.blob)}
                  />
                ) : null}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[11px] text-zinc-500">{p.fileName}</p>
                <p className="text-xs font-medium text-zinc-200">{label}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
