import { describe, expect, it } from "vitest";
import { summarizeAttendance } from "../client/src/lib/rsvp-summary";

describe("administrator RSVP attendance summary", () => {
  it("recalculates adult and child totals from attending records only", () => {
    expect(summarizeAttendance([{ attendance: "attending", adults: 2, children: 1 }, { attendance: "attending", adults: 1, children: 0 }, { attendance: "unable", adults: 4, children: 2 }])).toEqual({ teams: 2, adults: 3, children: 1, total: 4 });
  });

  it("never includes negative headcounts in live dashboard totals", () => {
    expect(summarizeAttendance([{ attendance: "attending", adults: -1, children: 2 }])).toEqual({ teams: 1, adults: 0, children: 2, total: 2 });
  });
});
