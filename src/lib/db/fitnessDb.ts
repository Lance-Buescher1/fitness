import Dexie, { type Table } from "dexie";
import type { FitnessDay } from "@/lib/fitness/types";
import type { FitnessRowRecord, PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";

class FitnessDexie extends Dexie {
  fitnessRows!: Table<FitnessRowRecord, string>;
  photos!: Table<PhotoRecord, number>;

  constructor() {
    super("gym_fitness_db");
    this.version(1).stores({
      fitnessRows: "date",
      photos: "++id, &fileName, takenAt",
    });
  }
}

export const db = new FitnessDexie();

export async function replaceFitnessRows(rows: FitnessDay[]): Promise<void> {
  await db.transaction("rw", db.fitnessRows, async () => {
    await db.fitnessRows.clear();
    if (rows.length > 0) await db.fitnessRows.bulkAdd(rows);
  });
}

export async function listFitnessRows(): Promise<FitnessDay[]> {
  const all = await db.fitnessRows.toArray();
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

function sortKeyForPhoto(p: PhotoRecord): string {
  const fromName = parsePhotoIsoDateFromFileName(p.fileName);
  if (fromName) return fromName;
  const d = new Date(p.takenAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  const items = await db.photos.toArray();
  return items.sort((a, b) => sortKeyForPhoto(a).localeCompare(sortKeyForPhoto(b)));
}

export async function addPhotosFromFiles(files: File[]): Promise<void> {
  for (const file of files) {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type || "image/jpeg" });
    const existing = await db.photos.where("fileName").equals(file.name).first();
    if (existing?.id != null) {
      await db.photos.update(existing.id, { blob, takenAt: file.lastModified });
    } else {
      await db.photos.add({
        fileName: file.name,
        takenAt: file.lastModified,
        blob,
      });
    }
  }
}

export async function clearPhotos(): Promise<void> {
  await db.photos.clear();
}
