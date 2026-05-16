"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FRAME_VIEWPORT_ASPECT,
  templateFromViewportTransform,
  type FrameViewportTemplate,
} from "@/lib/photos/frameTemplate";

type Transform = { scale: number; offset: { x: number; y: number } };

type Props = {
  blob: Blob;
  fileName: string;
  onSave: (template: FrameViewportTemplate) => void;
  onCancel: () => void;
};

function clampScale(s: number): number {
  return Math.max(0.2, Math.min(8, s));
}

function pinchDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function pinchCenter(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function PhotoFrameEditor({ blob, fileName, onSave, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const src = useMemo(() => URL.createObjectURL(blob), [blob]);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [transform, setTransform] = useState<Transform>({ scale: 1, offset: { x: 0, y: 0 } });
  const [isReady, setIsReady] = useState(false);
  const transformRef = useRef(transform);
  const naturalRef = useRef(natural);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number; focalX: number; focalY: number } | null>(
    null,
  );

  transformRef.current = transform;
  naturalRef.current = natural;

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const fitImage = useCallback((iw: number, ih: number, cw: number, ch: number) => {
    if (cw < 1 || ch < 1) return;
    const coverScale = Math.max(cw / iw, ch / ih);
    const next: Transform = {
      scale: coverScale,
      offset: {
        x: (cw - iw * coverScale) / 2,
        y: (ch - ih * coverScale) / 2,
      },
    };
    transformRef.current = next;
    setTransform(next);
    setIsReady(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !src) return;
    setIsReady(false);
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      setNatural({ w: iw, h: ih });
      naturalRef.current = { w: iw, h: ih };
      fitImage(iw, ih, el.clientWidth, el.clientHeight);
    };
    img.src = src;
  }, [src, fitImage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { w: iw, h: ih } = naturalRef.current;
      if (iw <= 1 && ih <= 1) return;
      fitImage(iw, ih, el.clientWidth, el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitImage]);

  const applyZoomAt = useCallback((factor: number, focalX: number, focalY: number) => {
    setTransform((prev) => {
      const nextScale = clampScale(prev.scale * factor);
      const ratio = nextScale / prev.scale;
      const next: Transform = {
        scale: nextScale,
        offset: {
          x: focalX - (focalX - prev.offset.x) * ratio,
          y: focalY - (focalY - prev.offset.y) * ratio,
        },
      };
      transformRef.current = next;
      return next;
    });
  }, []);

  const zoomByFactor = useCallback(
    (factor: number) => {
      const el = containerRef.current;
      if (!el || !isReady) return;
      applyZoomAt(factor, el.clientWidth / 2, el.clientHeight / 2);
    },
    [applyZoomAt, isReady],
  );

  const buildTemplate = useCallback((): FrameViewportTemplate => {
    const el = containerRef.current;
    if (!el) return { zoomFactor: 1, panX: 0, panY: 0 };
    const { w: iw, h: ih } = natural;
    const { scale, offset } = transform;
    return templateFromViewportTransform(iw, ih, el.clientWidth, el.clientHeight, scale, offset);
  }, [natural, transform]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      panRef.current = {
        px: e.clientX,
        py: e.clientY,
        ox: transformRef.current.offset.x,
        oy: transformRef.current.offset.y,
      };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      panRef.current = null;
      const pts = [...pointersRef.current.values()];
      const dist = pinchDistance(pts[0], pts[1]);
      const center = pinchCenter(pts[0], pts[1]);
      const rect = target.getBoundingClientRect();
      pinchRef.current = {
        distance: dist,
        scale: transformRef.current.scale,
        focalX: center.x - rect.left,
        focalY: center.y - rect.top,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      const dist = pinchDistance(pts[0], pts[1]);
      const center = pinchCenter(pts[0], pts[1]);
      const rect = e.currentTarget.getBoundingClientRect();
      const focalX = center.x - rect.left;
      const focalY = center.y - rect.top;

      if (!pinchRef.current) {
        pinchRef.current = {
          distance: dist,
          scale: transformRef.current.scale,
          focalX,
          focalY,
        };
        panRef.current = null;
        return;
      }

      const factor = dist / pinchRef.current.distance;
      const nextScale = clampScale(pinchRef.current.scale * factor);
      const ratio = nextScale / transformRef.current.scale;
      const next: Transform = {
        scale: nextScale,
        offset: {
          x: focalX - (focalX - transformRef.current.offset.x) * ratio,
          y: focalY - (focalY - transformRef.current.offset.y) * ratio,
        },
      };
      transformRef.current = next;
      setTransform(next);
      return;
    }

    if (panRef.current) {
      const dx = e.clientX - panRef.current.px;
      const dy = e.clientY - panRef.current.py;
      const next: Transform = {
        ...transformRef.current,
        offset: { x: panRef.current.ox + dx, y: panRef.current.oy + dy },
      };
      transformRef.current = next;
      setTransform(next);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      panRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    } else if (pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.entries()][0];
      panRef.current = {
        px: remaining[1].x,
        py: remaining[1].y,
        ox: transformRef.current.offset.x,
        oy: transformRef.current.offset.y,
      };
    }
  };

  const { scale, offset } = transform;

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
          style={{ aspectRatio: String(FRAME_VIEWPORT_ASPECT) }}
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
            disabled={!isReady}
            className="min-h-10 rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
            onClick={() => zoomByFactor(0.9)}
          >
            Zoom out
          </button>
          <button
            type="button"
            disabled={!isReady}
            className="min-h-10 rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
            onClick={() => zoomByFactor(1.1)}
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
            disabled={!isReady}
            className="min-h-11 flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            onClick={() => onSave(buildTemplate())}
          >
            Save frame
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
