export function normalizeCompanionNames(names: string[]) {
  return names.map(name => name.trim()).filter(Boolean);
}

export function parseCompanionNames(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === "string" && Boolean(name.trim())) : [];
  } catch { return []; }
}

export function displayPartyNames(primaryName: string, companionNames: string | null | undefined) {
  return [primaryName, ...parseCompanionNames(companionNames)].join(" · ");
}

export function addCompanionInput(names: string[], limit: number) {
  return names.length >= limit ? names : [...names, ""];
}

export function removeCompanionInput(names: string[], index: number) {
  return names.filter((_, position) => position !== index);
}
