import { describe, expect, it } from "vitest";
import { readPhotoTakenAt } from "@/lib/photos/readPhotoTakenAt";

describe("readPhotoTakenAt", () => {
  it("uses filename date for IMG_YYYYMMDD", async () => {
    const file = new File([new Uint8Array([0])], "IMG_20251015.jpg", {
      type: "image/jpeg",
      lastModified: 1,
    });
    const t = await readPhotoTakenAt(file);
    const d = new Date(t);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(15);
  });

  it("falls back to lastModified when no filename date or EXIF", async () => {
    const lm = new Date(2023, 2, 10).getTime();
    const file = new File([new Uint8Array([0])], "photo.jpg", {
      type: "image/jpeg",
      lastModified: lm,
    });
    expect(await readPhotoTakenAt(file)).toBe(lm);
  });
});
