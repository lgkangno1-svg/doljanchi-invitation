import { describe, expect, it } from "vitest";
import { preserveManagedMedia } from "./db";

describe("administrator media persistence", () => {
  it("keeps hero and gallery references out of ordinary invitation content updates", () => {
    const result = preserveManagedMedia({ motherName: "NGUYEN HONG NGOC", heroImageUrl: '{"url":"/manus-storage/hero.mp4"}', galleryImageUrls: '[{"url":"/manus-storage/gallery.jpg"}]' });
    expect(result).toEqual({ motherName: "NGUYEN HONG NGOC" });
    expect(result).not.toHaveProperty("heroImageUrl");
    expect(result).not.toHaveProperty("galleryImageUrls");
  });
});
