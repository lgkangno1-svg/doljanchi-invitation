export type InvitationMedia = { url: string; kind: "image" | "video"; mimeType: string; fileName: string };

const isMedia = (value: unknown): value is InvitationMedia => Boolean(value && typeof value === "object" && typeof (value as InvitationMedia).url === "string" && ((value as InvitationMedia).kind === "image" || (value as InvitationMedia).kind === "video"));

export function parseMedia(value: string | null | undefined): InvitationMedia | null {
  if (!value) return null;
  try { const parsed = JSON.parse(value); if (isMedia(parsed)) return parsed; } catch { /* legacy URL support below */ }
  return value.startsWith("/manus-storage/") ? { url: value, kind: /\.(mp4|webm)(\?|$)/i.test(value) ? "video" : "image", mimeType: "", fileName: "업로드 미디어" } : null;
}

export function parseMediaList(value: string | null | undefined): InvitationMedia[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(isMedia) : []; } catch { return []; }
}
