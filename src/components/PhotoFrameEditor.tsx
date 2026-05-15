"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NormalizedCropRect } from "@/lib/photos/cropImageBlob";

const ASPECT = 3 / 4;

type Props = {
  blob: Blob;
  fileName: string;
  onSave: (rect: NormalizedCropRect) => void;
  onCancel: () => void;
};

export function PhotoFrameEditor({ blob, fileName, onSave, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const src = useMemo(() => URL.createObjectURL(blob), [blob]);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const fitImage = useCallback((iw: number, ih: number, cw: number, ch: number) => {
    const coverScale = Math.max(cw / iw, ch / ih);
    setScale(coverScale);
    setOffset({
      x: (cw - iw * coverScale) / 2,
      y: (ch - ih * coverScale) / 2,
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !src) return;
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      fitImage(img.naturalWidth, img.naturalHeight, el.clientWidth, el.clientHeight);
    };
    img.src = src;
  }, [src, fitImage]);

  const computeCropRect = useCallback((): NormalizedCropRect => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0, width: 1, height: 1 };
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const { w: iw, h: ih } = natural;

    let sx = -offset.x / scale;
    let sy = -offset.y / scale;
    let sw = cw / scale;
    let sh = ch / scale;

    sx = Math.max(0, Math.min(iw - 1, sx));
    sy = Math.max(0, Math.min(ih - 1, sy));
    sw = Math.max(1, Math.min(iw - sx, sw));
    sh = Math.max(1, Math.min(ih - sy, sh));

    return {
      x: sx / iw,
      y: sy / ih,
      width: sw / iw,
      height: sh / ih,
    };
  }, [natural, offset, scale]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.px;
    const dy = e.clientY - dragRef.current.py;
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const zoom = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;
    setScale((s) => {
      const next = Math.max(0.2, Math.min(8, s * factor));
      setOffset((o) => ({
        x: cx - (cx - o.x) * (next / s),
        y: cy - (cy - o.y) * (next / s),
      }));
      return next;
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-frame-editor-title"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 id="photo-frame-editor-title" className="text-sm font-semibold text-zinc-100">
            Frame photo
          </h3>
          <p className="truncate text-xs text-zinc-500">{fileName}</p>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-xs touch-none overflow-hidden rounded-lg bg-zinc-900"
          style={{ aspectRatio: String(ASPECT) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute left-0 top-0 max-w-none select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "0 0",
              }}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-emerald-500/50" />
        </div>

        <div className="flex justify-center gap-2">
          <button
            type="button"
            className="min-h-10 rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
            onClick={() => zoom(0.9)}
          >
            Zoom out
          </button>
          <button
            type="button"
            className="min-h-10 rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
            onClick={() => zoom(1.1)}
          >
            Zoom in
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg border border-zinc-600 py-2.5 text-sm text-zinc-300"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={() => onSave(computeCropRect())}
          >
            Save frame
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
