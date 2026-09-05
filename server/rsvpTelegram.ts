import { readFile } from "node:fs/promises";

export type RsvpTelegramPayload = {
  name: string;
  companionNames: string[];
  attendance: "attending" | "unable";
  adults: number;
  children: number;
  contact?: string | null;
  note?: string | null;
};

async function readSecret(directValue: string | undefined, filePath: string): Promise<string> {
  const direct = directValue?.trim();
  if (direct) return direct;
  try {
    return (await readFile(filePath, "utf8")).trim();
  } catch {
    return "";
  }
}

async function readTelegramToken(): Promise<string> {
  return readSecret(
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_BOT_TOKEN_FILE?.trim() || "/run/secrets/telegram_bot_token",
  );
}

async function readTelegramChatId(): Promise<string> {
  return readSecret(
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_CHAT_ID_FILE?.trim() || "/run/secrets/telegram_chat_id",
  );
}

function sourceLabel(note?: string | null): string {
  return note?.trim().startsWith("[invite2]") ? "invite2 (조부모님 지인용)" : "invite (메인)";
}

export async function notifyRsvpTelegram(payload: RsvpTelegramPayload): Promise<boolean> {
  const [token, chatId] = await Promise.all([readTelegramToken(), readTelegramChatId()]);

  if (!token || !chatId) {
    console.warn("[rsvp-telegram] Telegram configuration is missing; RSVP was saved without notification.");
    return false;
  }

  const attendance = payload.attendance === "attending" ? "참석" : "불참";
  const lines = [
    "🎂 채원이 돌잔치 참석 여부가 등록되었습니다.",
    `출처: ${sourceLabel(payload.note)}`,
    `응답: ${attendance}`,
    `대표: ${payload.name}`,
    payload.companionNames.length ? `일행: ${payload.companionNames.join(", ")}` : "일행: 없음",
    `인원: 성인 ${payload.adults}명 / 어린이 ${payload.children}명`,
    payload.contact?.trim() ? `연락처: ${payload.contact.trim()}` : "연락처: 미입력",
    payload.note?.trim() && !payload.note.trim().startsWith("[invite2]") ? `메모: ${payload.note.trim()}` : null,
  ].filter((line): line is string => Boolean(line));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[rsvp-telegram] Telegram returned HTTP ${response.status}; RSVP remains saved.`);
      return false;
    }

    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    console.warn(`[rsvp-telegram] Telegram notification failed (${reason}); RSVP remains saved.`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
