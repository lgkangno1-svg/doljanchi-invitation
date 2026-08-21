import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getOrCreateInvitation: vi.fn(async () => ({ id: 1, slug: "invite-peach-ribbon", babyName: "서아", invitationTitle: "초대", greeting: "인사", eventDate: "2026. 10. 17 SAT", eventTime: "12:00 PM", venueName: "그랜드 홀", venueAddress: "주소", parkingInfo: "주차", accountInfo: "계좌", isPublished: 1 })),
  createGuestbook: vi.fn(async (_id: number, name: string, message: string) => ({ id: 1, authorName: name, message })),
  createRsvp: vi.fn(async (data: any) => ({ ...data, id: 1, editToken: "token" })), canSubmitGuestbook: vi.fn(() => true),
  listGuestbook: vi.fn(async () => []), listAllGuestbook: vi.fn(async () => []), listRsvp: vi.fn(async () => []),
  updateInvitation: vi.fn(), updateGuestbookVisibility: vi.fn(), deleteGuestbook: vi.fn(),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { copyText } from "../client/src/lib/copy";

const context = (role: "admin" | "user" = "user"): TrpcContext => ({ user: { id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });

describe("invitation interactions", () => {
  it("rejects empty guestbook content", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.invitation.addGuestbook({ name: "", message: "", website: "" })).rejects.toThrow();
  });
  it("rejects oversized guestbook content", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.invitation.addGuestbook({ name: "방문자", message: "x".repeat(301), website: "" })).rejects.toThrow();
  });
  it("allows an RSVP without a contact number", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.invitation.addRsvp({ name: "홍길동", attendance: "attending", adults: 1, children: 0, meal: true, note: "축하해요" });
    expect(result.name).toBe("홍길동");
    expect(result.contact).toBeNull();
  });
  it("is SSR-safe when clipboard is unavailable", async () => {
    expect(await copyText("sample")).toBe(false);
  });
  it("blocks non-admin dashboard access", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.dashboard()).rejects.toThrow();
  });
});
