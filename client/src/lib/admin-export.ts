import { displayPartyNames } from "@/lib/companions";
import { parseRsvpAttendeeDetails, RSVP_ROLE_LABEL } from "@/lib/rsvp-attendees";
import { summarizeAttendance } from "@/lib/rsvp-summary";

type RsvpExportRecord = { id: number; name: string; companionNames: string | null; attendeeDetails: string | null; attendance: "attending" | "unable"; adults: number; children: number; contact: string | null; note: string | null; createdAt: Date | string };
type GuestbookExportRecord = { id: number; authorName: string; companionNames: string | null; message: string; isHidden: number | boolean; createdAt: Date | string };

export type AdminExportData = { invitation: { babyName: string; eventDate: string; eventTime: string; venueName: string }; rsvps: RsvpExportRecord[]; guestbook: GuestbookExportRecord[] };

export function isAdminExportVisible(isAdmin: boolean, hasDashboardData: boolean) {
  return isAdmin && hasDashboardData;
}

const theme = { espresso: "382117", gold: "C9A568", cream: "FFF9F0", peach: "F5E5D2", muted: "79685D" };
const headers = (sheet: any, row: number, values: string[]) => { values.forEach((value, index) => { const cell = sheet.getCell(row, index + 2); cell.value = value; cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Malgun Gothic" }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.espresso } }; cell.alignment = { horizontal: "center", vertical: "center", wrapText: true }; }); sheet.getRow(row).height = 27; };
const safeText = (value: unknown) => { const text = String(value ?? ""); return /^[=+\-@]/.test(text) ? `'${text}` : text; };
const formatDate = (value: Date | string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); };
const bodyCell = (cell: any, value: unknown, alignment: "left" | "center" = "left") => { cell.value = safeText(value); cell.font = { name: "Malgun Gothic", size: 10, color: { argb: "332821" } }; cell.alignment = { horizontal: alignment, vertical: "center", wrapText: true, indent: alignment === "left" ? 1 : 0 }; };

export async function buildAdminWorkbook(data: AdminExportData) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "채원이 첫돌 초대장";
  workbook.created = new Date();

  const summary = summarizeAttendance(data.rsvps);
  const overview = workbook.addWorksheet("요약");
  overview.views = [{ showGridLines: false }]; overview.getColumn(1).width = 3; overview.getColumn(2).width = 23; overview.getColumn(3).width = 48;
  overview.mergeCells("B2:C2"); overview.getCell("B2").value = `${data.invitation.babyName} 첫돌 · 참석 현황`; overview.getCell("B2").font = { name: "Georgia", size: 19, bold: true, color: { argb: theme.espresso } }; overview.getRow(2).height = 34;
  overview.mergeCells("B3:C3"); overview.getCell("B3").value = `${data.invitation.eventDate} · ${data.invitation.eventTime} · ${data.invitation.venueName}`; overview.getCell("B3").font = { name: "Malgun Gothic", size: 10, color: { argb: theme.muted } };
  headers(overview, 5, ["항목", "현재 현황"]);
  [["참석 응답", `${summary.teams}팀`], ["12세 이상", `${summary.adults}명`], ["12세 미만", `${summary.children}명`], ["방명록", `${data.guestbook.length}건`], ["생성 시각", formatDate(new Date())]].forEach(([label, value], index) => { const row = index + 6; bodyCell(overview.getCell(row, 2), label); bodyCell(overview.getCell(row, 3), value); overview.getRow(row).height = 22; });
  overview.mergeCells("B13:C13"); overview.getCell("B13").value = "데이터는 다운로드 시점의 관리자 명단입니다."; overview.getCell("B13").font = { name: "Malgun Gothic", size: 9, italic: true, color: { argb: theme.muted } };

  const rsvpSheet = workbook.addWorksheet("참석 응답");
  rsvpSheet.views = [{ showGridLines: false, state: "frozen", ySplit: 5 }]; rsvpSheet.getColumn(1).width = 3;
  [18, 31, 9, 12, 12, 15, 18, 38, 21].forEach((width, index) => { rsvpSheet.getColumn(index + 2).width = width; });
  rsvpSheet.mergeCells("B2:J2"); rsvpSheet.getCell("B2").value = "참석 응답 명단"; rsvpSheet.getCell("B2").font = { name: "Georgia", size: 17, bold: true, color: { argb: theme.espresso } }; rsvpSheet.getRow(2).height = 31;
  headers(rsvpSheet, 4, ["대표 성함", "전체 참석자", "응답", "12세 이상", "12세 미만", "연락처", "전달 말씀", "응답 시각", "상세 구성"]);
  data.rsvps.forEach((response, index) => { const row = index + 5; const details = parseRsvpAttendeeDetails(response.attendeeDetails).map(attendee => `${RSVP_ROLE_LABEL[attendee.role]} ${attendee.name} · ${attendee.ageGroup === "under12" ? "12세 미만" : "12세 이상"}`).join(" / "); const values = [response.name, displayPartyNames(response.name, response.companionNames), response.attendance === "attending" ? "참석" : "불참", response.adults, response.children, response.contact || "", response.note || "", formatDate(response.createdAt), details]; values.forEach((value, columnIndex) => bodyCell(rsvpSheet.getCell(row, columnIndex + 2), value, [2, 4, 5, 6, 9].includes(columnIndex) ? "center" : "left")); rsvpSheet.getRow(row).height = 34; });
  rsvpSheet.autoFilter = { from: { row: 4, column: 2 }, to: { row: Math.max(4, data.rsvps.length + 4), column: 10 } };

  const guestbookSheet = workbook.addWorksheet("방명록");
  guestbookSheet.views = [{ showGridLines: false, state: "frozen", ySplit: 5 }]; guestbookSheet.getColumn(1).width = 3;
  [19, 28, 45, 12, 21].forEach((width, index) => { guestbookSheet.getColumn(index + 2).width = width; });
  guestbookSheet.mergeCells("B2:F2"); guestbookSheet.getCell("B2").value = "방명록 명단"; guestbookSheet.getCell("B2").font = { name: "Georgia", size: 17, bold: true, color: { argb: theme.espresso } }; guestbookSheet.getRow(2).height = 31;
  headers(guestbookSheet, 4, ["대표 성함", "함께 남긴 일행", "메시지", "공개 상태", "작성 시각"]);
  data.guestbook.forEach((entry, index) => { const row = index + 5; const values = [entry.authorName, displayPartyNames(entry.authorName, entry.companionNames), entry.message, entry.isHidden ? "숨김" : "공개", formatDate(entry.createdAt)]; values.forEach((value, columnIndex) => bodyCell(guestbookSheet.getCell(row, columnIndex + 2), value, [3, 4].includes(columnIndex) ? "center" : "left")); guestbookSheet.getRow(row).height = 38; });
  guestbookSheet.autoFilter = { from: { row: 4, column: 2 }, to: { row: Math.max(4, data.guestbook.length + 4), column: 6 } };
  for (const sheet of [rsvpSheet, guestbookSheet]) for (let row = 5; row <= sheet.rowCount; row += 1) if (row % 2 === 1) for (let column = 2; column <= sheet.columnCount; column += 1) sheet.getCell(row, column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.cream } };
  return workbook;
}

export async function downloadAdminWorkbook(data: AdminExportData) {
  const workbook = await buildAdminWorkbook(data);
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `채원이_첫돌_명단_${new Date().toISOString().slice(0, 10)}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
}
