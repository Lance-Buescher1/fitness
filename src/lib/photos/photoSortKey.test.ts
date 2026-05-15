import { describe, expect, it } from "vitest";
import type { PhotoRecord } from "@/lib/db/types";
import { photoDisplayLabel, photoSortKey } from "@/lib/photos/photoSortKey";

function photo(partial: Partial<PhotoRecord> & Pick<PhotoRecord, "fileName" | "takenAt">): PhotoRecord {
  return {
    blob: new Blob(),
    ...partial,
  };
}

describe("photoSortKey", () => {
  it("prefers IMG_YYYYMMDD from filename", () => {
    const p = photo({ fileName: "IMG_20251001.jpg", takenAt: 0 });
    expect(photoSortKey(p)).toBe("2025-10-01");
  });

  it("falls back to takenAt date", () => {
    const t = new Date(2024, 5, 15, 8, 0, 0).getTime();
    const p = photo({ fileName: "random.jpg", takenAt: t });
    expect(photoSortKey(p)).toBe("2024-06-15");
  });

  it("photoDisplayLabel matches sort key", () => {
    const p = photo({ fileName: "IMG_20250102.jpg", takenAt: 999 });
    expect(photoDisplayLabel(p)).toBe("2025-01-02");
  });
});
