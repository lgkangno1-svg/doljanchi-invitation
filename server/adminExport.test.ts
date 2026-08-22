import { describe, expect, it } from "vitest";
import { buildAdminWorkbook, isAdminExportVisible } from "../client/src/lib/admin-export";

describe("administrator workbook export", () => {
  it("creates a readable overview, RSVP, and guestbook workbook", async () => {
    const workbook = await buildAdminWorkbook({ invitation: { babyName: "채원", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동 · 3층 한양 1+2홀" }, rsvps: [{ id: 1, name: "강호성", companionNames: '["NGUYEN HONG NGOC","민준"]', attendeeDetails: '[{"role":"father","name":"강호성","ageGroup":"over12"},{"role":"mother","name":"NGUYEN HONG NGOC","ageGroup":"over12"},{"role":"baby","name":"민준","ageGroup":"under12"}]', attendance: "attending", adults: 2, children: 1, contact: "010-0000-0000", note: "축하합니다", createdAt: new Date("2026-08-22T00:00:00.000Z") }], guestbook: [{ id: 1, authorName: "김하늘", companionNames: '["박바다"]', message: "첫돌을 축하합니다", isHidden: 0, createdAt: new Date("2026-08-22T00:00:00.000Z") }] });
    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(["요약", "참석 응답", "방명록"]);
    expect(workbook.getWorksheet("요약")?.getCell("C6").value).toBe("1팀");
    expect(workbook.getWorksheet("참석 응답")?.getCell("C5").value).toContain("NGUYEN HONG NGOC");
    expect(workbook.getWorksheet("방명록")?.getCell("D5").value).toBe("첫돌을 축하합니다");
  });

  it("neutralizes spreadsheet formulas contained in visitor-entered text", async () => {
    const workbook = await buildAdminWorkbook({ invitation: { babyName: "채원", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "한양홀" }, rsvps: [], guestbook: [{ id: 2, authorName: "=unsafe", companionNames: "[]", message: "+unsafe", isHidden: 0, createdAt: new Date() }] });
    const sheet = workbook.getWorksheet("방명록");
    expect(sheet?.getCell("B5").value).toBe("'=unsafe");
    expect(sheet?.getCell("D5").value).toBe("'+unsafe");
  });

  it("shows the export action only after administrator authentication and dashboard loading", () => {
    expect(isAdminExportVisible(false, true)).toBe(false);
    expect(isAdminExportVisible(true, false)).toBe(false);
    expect(isAdminExportVisible(true, true)).toBe(true);
  });
});
