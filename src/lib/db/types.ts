import type { FitnessDay } from "@/lib/fitness/types";

export type FitnessRowRecord = FitnessDay;

export type PhotoRecord = {
  id?: number;
  fileName: string;
  takenAt: number;
  blob: Blob;
  /** True when loaded from or saved to PhotosFramed (crop already applied). */
  isFramed?: boolean;
  framedFileName?: string;
};
