import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompanionFields, PartyNameLabel } from "../client/src/components/CompanionFields";

describe("companion UI rendering", () => {
  it("renders the add control and existing companion input with a removal control", () => {
    const html = renderToStaticMarkup(createElement(CompanionFields, { title: "함께 참석하는 일행", labelPrefix: "일행 성함", max: 3, names: ["민호"], guidance: "참석하시는 모든 분의 성함을 정확히 적어 주세요.", onChange: () => undefined, onAdd: () => undefined, onRemove: () => undefined }));
    expect(html).toContain("일행 추가");
    expect(html).toContain("오른쪽 추가 버튼으로 일행 성함 입력칸 추가");
    expect(html).toContain("참석하시는 모든 분의 성함을 정확히 적어 주세요.");
    expect(html).toContain("일행 성함 1");
    expect(html).toContain("일행 1 삭제");
  });

  it("renders every public party name in a compact label", () => {
    const html = renderToStaticMarkup(createElement(PartyNameLabel, { primaryName: "지연", companionNames: '["수진","민호"]' }));
    expect(html).toContain("지연 · 수진 · 민호");
  });
});
