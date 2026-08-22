import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("curated invitation gallery layout", () => {
  it("preserves the hero media while assigning five gallery photos to editorial slots", () => {
    const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(homeSource).toContain('className="hero-media" media={heroMedia}');
    expect(homeSource).toContain('className="gallery-portrait" media={galleryMedia[0]');
    expect(homeSource).toContain('className="gallery-detail" media={galleryMedia[1]');
    expect(homeSource).toContain('className="seasonal-transition-media" media={galleryMedia[2]');
    expect(homeSource).toContain('galleryMedia.slice(3)');
  });
});
