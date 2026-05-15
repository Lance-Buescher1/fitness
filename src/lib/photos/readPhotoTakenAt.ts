import exifr from "exifr";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";

function isoDateToNoonMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

function parseExifDate(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  if (typeof value === "string" && value.trim()) {
    const t = Date.parse(value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

/**
 * Capture time for sorting/display. Prefers filename date, then EXIF, then file lastModified.
 */
export async function readPhotoTakenAt(file: File): Promise<number> {
  const fromName = parsePhotoIsoDateFromFileName(file.name);
  if (fromName) return isoDateToNoonMs(fromName);

  try {
    const buf = await file.arrayBuffer();
    const meta = await exifr.parse(buf, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    if (meta && typeof meta === "object") {
      const record = meta as Record<string, unknown>;
      for (const key of ["DateTimeOriginal", "CreateDate", "ModifyDate"] as const) {
        const t = parseExifDate(record[key]);
        if (t != null) return t;
      }
    }
  } catch {
    /* fall through to lastModified */
  }

  return file.lastModified;
}
