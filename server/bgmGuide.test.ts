import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BgmGuide } from "../client/src/components/BgmGuide";

describe("BGM guide", () => {
  it("renders one directional arrow for the BGM control", () => {
    const html = renderToStaticMarkup(createElement(BgmGuide, { onActivate: () => undefined }));
    expect((html.match(/→/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain("↘");
    expect(html).toContain("music-guide-arrow");
  });
});
