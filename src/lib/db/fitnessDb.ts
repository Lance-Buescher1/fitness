import Dexie, { type Table } from "dexie";
import type { FitnessDay } from "@/lib/fitness/types";
import type { FitnessRowRecord, PhotoRecord } from "@/lib/db/types";
import { parsePhotoIsoDateFromFileName } from "@/lib/dates/parsePhotoFileName";
import { blobTypeForImageFile, guessImageMimeFromFileName } from "@/lib/files/imageMime";

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

/**
 * WebKit often hands back Blobs from IndexedDB that do not paint reliably with
 * `URL.createObjectURL` until copied into a fresh Blob with an explicit MIME type.
 */
async function materializeStoredPhotoBlob(row: PhotoRecord): Promise<PhotoRecord> {
  const raw = row.blob;
  const source = raw instanceof Blob ? raw : new Blob([], { type: "application/octet-stream" });
  const buf = await source.arrayBuffer();
  const type =
    source.type && source.type !== "application/octet-stream"
      ? source.type
      : guessImageMimeFromFileName(row.fileName);
  return { ...row, blob: new Blob([buf], { type }) };
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  const items = await db.photos.toArray();
  const materialized = await Promise.all(items.map((row) => materializeStoredPhotoBlob(row)));
  return materialized.sort((a, b) => sortKeyForPhoto(a).localeCompare(sortKeyForPhoto(b)));
}

export async function addPhotosFromFiles(files: File[]): Promise<void> {
  const prepared = await Promise.all(
    files.map(async (file) => {
      const buf = await file.arrayBuffer();
      const blob = new Blob([buf], { type: blobTypeForImageFile(file) });
      return { fileName: file.name, takenAt: file.lastModified, blob };
    }),
  );
  await db.transaction("rw", db.photos, async () => {
    for (const { fileName, takenAt, blob } of prepared) {
      const existing = await db.photos.where("fileName").equals(fileName).first();
      if (existing?.id != null) {
        await db.photos.update(existing.id, { blob, takenAt });
      } else {
        await db.photos.add({ fileName, takenAt, blob });
      }
    }
  });
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
