import { describe, expect, it, vi } from "vitest";
import { accountCopySuccessMessage, copyAccountNumber } from "../client/src/lib/account-copy";

describe("account-number copy", () => {
  it("delegates the exact account number to the clipboard and reports success", async () => {
    const copy = vi.fn(async () => true);
    await expect(copyAccountNumber("3333-19-8058955", copy)).resolves.toBe(true);
    expect(copy).toHaveBeenCalledWith("3333-19-8058955");
  });

  it("preserves a failed clipboard result for the UI error feedback", async () => {
    await expect(copyAccountNumber("3333-19-8058955", async () => false)).resolves.toBe(false);
  });

  it("uses the requested success feedback after copying", () => {
    expect(accountCopySuccessMessage()).toBe("복사되었습니다");
  });
});
