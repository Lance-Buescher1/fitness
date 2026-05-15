import type { PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";

/** ISO date string `YYYY-MM-DD` for chronological sort. */
export function photoSortKey(p: PhotoRecord): string {
  const fromName = parsePhotoIsoDateFromFileName(p.fileName);
  if (fromName) return fromName;
  const d = new Date(p.takenAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function photoDisplayLabel(p: PhotoRecord): string {
  return photoSortKey(p);
}
