import { describe, expect, it } from "vitest";
import { addCompanionInput, displayPartyNames, normalizeCompanionNames, parseCompanionNames, removeCompanionInput } from "../client/src/lib/companions";

describe("companion name helpers", () => {
  it("normalizes only usable companion names", () => {
    expect(normalizeCompanionNames(["  수진 ", "", "   ", "민호"])).toEqual(["수진", "민호"]);
  });

  it("renders a representative and companions for public and admin labels", () => {
    expect(parseCompanionNames('["수진","민호"]')).toEqual(["수진", "민호"]);
    expect(displayPartyNames("지연", '["수진","민호"]')).toBe("지연 · 수진 · 민호");
  });

  it("adds and removes companion input rows without exceeding the visible control limit", () => {
    expect(addCompanionInput([], 2)).toEqual([""]);
    expect(addCompanionInput(["", ""], 2)).toEqual(["", ""]);
    expect(removeCompanionInput(["수진", "민호"], 0)).toEqual(["민호"]);
  });
});
