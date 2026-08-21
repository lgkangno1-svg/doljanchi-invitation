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
import { buildVenueLinks } from "../client/src/lib/venue-links";

const context = (role: "admin" | "user" = "user"): TrpcContext => ({ user: { id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, adminSession: false, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });

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
  it("builds map and navigation links for the verified hotel destination", () => {
    const links = buildVenueLinks("코트야드 메리어트 서울 명동", "서울특별시 중구 남대문로 9");
    expect(links.naver).toContain(encodeURIComponent("코트야드 메리어트 서울 명동 서울특별시 중구 남대문로 9"));
    expect(links.kakaoMap).toContain("map.kakao.com");
    expect(links.tmap).toContain("goalx=126.9791");
    expect(links.kakaoNavi).toContain("coordType=wgs84");
  });
  it("requires both parent names when an admin updates invitation content", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.admin.updateInvitation({ babyName: "채원", invitationTitle: "초대", greeting: "인사", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동", venueAddress: "서울특별시 중구 남대문로 9", parkingInfo: "주차 안내", accountInfo: "강호성 | 카카오뱅크 3333-19-8058955" } as any)).rejects.toThrow();
  });
  it("blocks non-admin media uploads before any file can be stored", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.uploadMedia({ fileName: "chaewon.gif", mimeType: "image/gif", dataBase64: "R0lGOA==" })).rejects.toThrow();
  });
  it("blocks non-admin dashboard access", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.dashboard()).rejects.toThrow();
  });
});
