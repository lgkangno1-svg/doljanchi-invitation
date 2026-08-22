export type RsvpSummaryInput = { attendance: "attending" | "unable"; adults: number; children: number };

export function summarizeAttendance(rsvps: RsvpSummaryInput[]) {
  const attending = rsvps.filter(response => response.attendance === "attending");
  const adults = attending.reduce((sum, response) => sum + Math.max(0, response.adults), 0);
  const children = attending.reduce((sum, response) => sum + Math.max(0, response.children), 0);
  return { teams: attending.length, adults, children, total: adults + children };
}
