import { describe, expect, it } from "vitest";
import { createInitialRsvpAttendees, parseRsvpAttendeeDetails, summarizeRsvpAttendees } from "../client/src/lib/rsvp-attendees";

describe("structured RSVP attendees", () => {
  it("starts with easy-to-understand father, mother, and baby fields", () => {
    expect(createInitialRsvpAttendees().map(attendee => attendee.role)).toEqual(["father", "mother", "baby"]);
  });

  it("derives names and 12세 미만·이상 counts from named attendees", () => {
    const summary = summarizeRsvpAttendees([
      { role: "father", name: "강호성", ageGroup: "over12" },
      { role: "mother", name: "Nguyen HongNgoc", ageGroup: "over12" },
      { role: "baby", name: "민준", ageGroup: "under12" },
    ]);
    expect(summary.primaryName).toBe("강호성");
    expect(summary.companionNames).toEqual(["Nguyen HongNgoc", "민준"]);
    expect([summary.adults, summary.children]).toEqual([2, 1]);
  });

  it("parses only valid saved attendee records for the admin display", () => {
    expect(parseRsvpAttendeeDetails('[{"role":"baby","name":"민준","ageGroup":"under12"}]')).toEqual([{ role: "baby", name: "민준", ageGroup: "under12" }]);
  });
});
