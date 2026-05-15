import Dexie, { type Table } from "dexie";
import type { FitnessDay } from "@/lib/fitness/types";
import type { FitnessRowRecord, PhotoRecord } from "@/lib/db/types";
import { blobTypeForImageFile, guessImageMimeFromFileName } from "@/lib/files/imageMime";
import { readPhotoTakenAt } from "@/lib/photos/readPhotoTakenAt";
import { photoSortKey } from "@/lib/photos/photoSortKey";

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
    this.version(3).stores({
      fitnessRows: "date",
      photos: "++id, &fileName, takenAt, isFramed",
      appMeta: "key",
    });
  }
}

export const db = new FitnessDexie();

export { photoSortKey };

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

export async function getFitnessRow(date: string): Promise<FitnessDay | undefined> {
  return db.fitnessRows.get(date);
}

/** Merge `partial` onto existing row for `date` (missing keys keep prior values). */
export async function upsertFitnessDayMerge(
  date: string,
  partial: Partial<Pick<FitnessDay, "caloriesBurned" | "weight" | "workoutCompleted">>,
): Promise<FitnessDay> {
  const prev = await db.fitnessRows.get(date);
  const next: FitnessDay = {
    date,
    caloriesBurned:
      partial.caloriesBurned !== undefined ? partial.caloriesBurned : (prev?.caloriesBurned ?? null),
    weight: partial.weight !== undefined ? partial.weight : (prev?.weight ?? null),
    workoutCompleted:
      partial.workoutCompleted !== undefined
        ? partial.workoutCompleted
        : (prev?.workoutCompleted ?? null),
  };
  await db.fitnessRows.put(next);
  return next;
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
  return materialized.sort((a, b) => {
    const ka = photoSortKey(a);
    const kb = photoSortKey(b);
    if (ka !== kb) return ka.localeCompare(kb);
    return a.fileName.localeCompare(b.fileName);
  });
}

export type AddPhotosOptions = {
  isFramed?: boolean;
};

export async function addPhotosFromFiles(
  files: File[],
  options: AddPhotosOptions = {},
): Promise<void> {
  const isFramed = options.isFramed ?? false;
  const prepared = await Promise.all(
    files.map(async (file) => {
      const buf = await file.arrayBuffer();
      const blob = new Blob([buf], { type: blobTypeForImageFile(file) });
      const takenAt = await readPhotoTakenAt(file);
      const framedFileName = isFramed
        ? file.name.replace(/\.[^.]+$/i, "") + ".jpg"
        : undefined;
      return {
        fileName: file.name,
        takenAt,
        blob,
        isFramed,
        framedFileName,
      };
    }),
  );
  await db.transaction("rw", db.photos, async () => {
    for (const { fileName, takenAt, blob, isFramed: framed, framedFileName } of prepared) {
      const existing = await db.photos.where("fileName").equals(fileName).first();
      if (existing?.id != null) {
        await db.photos.update(existing.id, { blob, takenAt, isFramed: framed, framedFileName });
      } else {
        await db.photos.add({
          fileName,
          takenAt,
          blob,
          isFramed: framed,
          framedFileName,
        });
      }
    }
  });
}

export async function updatePhotoBlob(
  id: number,
  blob: Blob,
  opts?: { isFramed?: boolean; framedFileName?: string },
): Promise<void> {
  const patch: Partial<PhotoRecord> = { blob };
  if (opts?.isFramed !== undefined) patch.isFramed = opts.isFramed;
  if (opts?.framedFileName !== undefined) patch.framedFileName = opts.framedFileName;
  await db.photos.update(id, patch);
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
