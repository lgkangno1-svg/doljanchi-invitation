// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountSection } from "../client/src/components/AccountSection";

describe("account copy UI", () => {
  it("opens the account area, copies the account, and shows the requested success feedback", async () => {
    const user = userEvent.setup(); const copyAccount = vi.fn(async () => true);
    render(<AccountSection accounts={[{ label: "강호성", value: "3333-19-8058955" }]} copyAccount={copyAccount} />);
    expect(screen.queryByRole("button", { name: "강호성 계좌번호 복사" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "계좌번호 확인하기" }));
    await user.click(screen.getByRole("button", { name: "강호성 계좌번호 복사" }));
    expect(copyAccount).toHaveBeenCalledWith("3333-19-8058955");
    expect((await screen.findByRole("status")).textContent).toContain("복사되었습니다");
  });
});
