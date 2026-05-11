import Dexie, { type Table } from "dexie";
import type { FitnessDay } from "@/lib/fitness/types";
import type { FitnessRowRecord, PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";
import { blobTypeForImageFile } from "@/lib/files/imageMime";

export const GYM_DATA_DIR_META_KEY = "gymDataDirectory";

export type AppMetaRecord = {
  key: string;
  dirHandle?: FileSystemDirectoryHandle;
};

class FitnessDexie extends Dexie {
  fitnessRows!: Table<FitnessRowRecord, string>;
  photos!: Table<PhotoRecord, number>;
  appMeta!: Table<AppMetaRecord, string>;

  constructor() {
    super("gym_fitness_db");
    this.version(1).stores({
      fitnessRows: "date",
      photos: "++id, &fileName, takenAt",
    });
    this.version(2).stores({
      fitnessRows: "date",
      photos: "++id, &fileName, takenAt",
      appMeta: "key",
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
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: blobTypeForImageFile(file) });
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

export async function saveGymDataDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await db.appMeta.put({ key: GYM_DATA_DIR_META_KEY, dirHandle: handle });
}

export async function loadGymDataDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const row = await db.appMeta.get(GYM_DATA_DIR_META_KEY);
  return row?.dirHandle;
}

export async function clearGymDataDirectoryHandle(): Promise<void> {
  await db.appMeta.delete(GYM_DATA_DIR_META_KEY);
}
