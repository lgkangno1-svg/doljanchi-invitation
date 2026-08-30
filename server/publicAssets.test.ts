import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");

const publicAssets = [
  "client/public/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png",
  "client/public/manus-storage/chaewon-gallery-feet.jpg",
  "client/public/manus-storage/chaewon-gallery-hands.jpg",
];

describe("public invitation assets", () => {
  it("keeps every committed hero/gallery fallback on disk", () => {
    for (const relativePath of publicAssets) {
      expect(existsSync(resolve(root, relativePath)), `${relativePath} should exist`).toBe(true);
    }
  });

  it("points the hero fallback at the committed production hero", () => {
    expect(homeSource).toContain('const HERO_IMAGE = "/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png"');
  });

  it("renders gallery media instead of only parsing it", () => {
    expect(homeSource).toContain('className="gallery-portrait" media={galleryMedia[0]');
    expect(homeSource).toContain('className="seasonal-transition-media" media={galleryMedia[1]');
    expect(homeSource).toContain("galleryMedia.slice(2)");
  });
});
