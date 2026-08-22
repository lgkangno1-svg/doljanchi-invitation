export type RsvpAttendeeRole = "father" | "mother" | "baby" | "guest";
export type RsvpAgeGroup = "under12" | "over12";

export type RsvpAttendee = {
  role: RsvpAttendeeRole;
  name: string;
  ageGroup: RsvpAgeGroup;
};

export const RSVP_ROLE_LABEL: Record<RsvpAttendeeRole, string> = {
  father: "참석자",
  mother: "참석자",
  baby: "자녀 · 아동",
  guest: "동행 일행",
};

export function createInitialRsvpAttendees(): RsvpAttendee[] {
  return [
    { role: "guest", name: "", ageGroup: "over12" },
  ];
}

export function normalizeRsvpAttendees(attendees: RsvpAttendee[]) {
  return attendees
    .map(attendee => ({ ...attendee, name: attendee.name.trim() }))
    .filter(attendee => attendee.name.length > 0);
}

export function summarizeRsvpAttendees(attendees: RsvpAttendee[]) {
  const normalized = normalizeRsvpAttendees(attendees);
  return {
    attendees: normalized,
    primaryName: normalized[0]?.name ?? "",
    companionNames: normalized.slice(1).map(attendee => attendee.name),
    adults: normalized.filter(attendee => attendee.ageGroup === "over12").length,
    children: normalized.filter(attendee => attendee.ageGroup === "under12").length,
  };
}

export function parseRsvpAttendeeDetails(value: string | null | undefined): RsvpAttendee[] {
  try {
    const parsed = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RsvpAttendee => item && typeof item.name === "string" && ["father", "mother", "baby", "guest"].includes(item.role) && ["under12", "over12"].includes(item.ageGroup));
  } catch {
    return [];
  }
}
