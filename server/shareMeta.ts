export function resolveShareImage(heroMediaValue: string | null | undefined, fallback: string) {
  if (!heroMediaValue) return fallback;
  try {
    const media = JSON.parse(heroMediaValue) as { url?: unknown; kind?: unknown };
    if (media.kind === "image" && typeof media.url === "string" && media.url.startsWith("/manus-storage/")) return media.url;
  } catch {
    if (heroMediaValue.startsWith("/manus-storage/")) return heroMediaValue;
  }
  return fallback;
}

export function absoluteShareUrl(origin: string | undefined, relativePath: string) {
  const normalizedOrigin = origin?.replace(/\/$/, "");
  return normalizedOrigin ? `${normalizedOrigin}${relativePath}` : relativePath;
}
