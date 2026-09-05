import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyRsvpTelegram } from "./rsvpTelegram";

afterEach(() => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  delete process.env.TELEGRAM_BOT_TOKEN_FILE;
  vi.unstubAllGlobals();
});

describe("RSVP Telegram notifier", () => {
  it("sends a plain-text RSVP summary when configured", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "unit-test-token";
    process.env.TELEGRAM_CHAT_ID = "unit-test-chat";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(notifyRsvpTelegram({
      name: "홍길동",
      companionNames: ["김길동"],
      attendance: "attending",
      adults: 2,
      children: 1,
      contact: "010-0000-0000",
      note: null,
    })).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/botunit-test-token/sendMessage");
    const payload = JSON.parse(String(init.body));
    expect(payload.chat_id).toBe("unit-test-chat");
    expect(payload.text).toContain("출처: invite (메인)");
    expect(payload.text).toContain("응답: 참석");
    expect(payload.text).toContain("대표: 홍길동");
    expect(payload.text).toContain("일행: 김길동");
  });

  it("labels invite2 responses and never throws on Telegram HTTP failure", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "unit-test-token";
    process.env.TELEGRAM_CHAT_ID = "unit-test-chat";
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(notifyRsvpTelegram({
      name: "테스트",
      companionNames: [],
      attendance: "unable",
      adults: 0,
      children: 0,
      note: "[invite2] 조부모님 지인용 초대장",
    })).resolves.toBe(false);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload.text).toContain("출처: invite2 (조부모님 지인용)");
    expect(payload.text).toContain("응답: 불참");
  });
});
