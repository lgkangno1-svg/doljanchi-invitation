import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompanionFields, PartyNameLabel } from "../client/src/components/CompanionFields";

describe("companion UI rendering", () => {
  it("renders the add control and existing companion input with a removal control", () => {
    const html = renderToStaticMarkup(createElement(CompanionFields, { title: "함께 참석하는 일행", labelPrefix: "일행 성함", max: 3, names: ["민호"], onChange: () => undefined, onAdd: () => undefined, onRemove: () => undefined }));
    expect(html).toContain("+ 일행 추가");
    expect(html).toContain("일행 성함 1");
    expect(html).toContain("일행 1 삭제");
  });

  it("renders every public party name in a compact label", () => {
    const html = renderToStaticMarkup(createElement(PartyNameLabel, { primaryName: "지연", companionNames: '["수진","민호"]' }));
    expect(html).toContain("지연 · 수진 · 민호");
  });
});
