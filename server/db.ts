import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, invitations, guestbookEntries, rsvpResponses } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0];
}

const defaultInvitation = {
  slug: "invite-peach-ribbon-x7k2p",
  babyName: "서아",
  invitationTitle: "서아의 첫 번째 생일에 소중한 분들을 초대합니다.",
  greeting: "작고 사랑스러운 손으로 세상을 배워가는 서아가 어느새 첫 번째 생일을 맞았습니다. 따뜻한 마음으로 함께 축하해 주세요.",
  eventDate: "2026. 10. 17 SAT",
  eventTime: "12:00 PM",
  venueName: "그랜드 홀",
  venueAddress: "서울특별시 ○○구 ○○로 123, 3층",
  parkingInfo: "건물 지하주차장 이용 · 참석객 3시간 무료 · 출차 전 데스크에서 차량번호를 등록해 주세요.",
  accountInfo: "아빠 | 국민은행 123-456-789\n엄마 | 신한은행 123-456-789",
  isPublished: 1,
};

export async function getOrCreateInvitation(slug = defaultInvitation.slug) {
  const db = await getDb(); if (!db) return { id: 0, ...defaultInvitation };
  const rows = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(invitations).values(defaultInvitation);
  const created = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  return created[0] ?? { id: 0, ...defaultInvitation };
}

export async function updateInvitation(data: Partial<typeof defaultInvitation>) {
  const db = await getDb(); if (!db) return getOrCreateInvitation();
  const current = await getOrCreateInvitation();
  await db.update(invitations).set(data).where(eq(invitations.id, current.id));
  return getOrCreateInvitation();
}

export async function listGuestbook(invitationId: number) {
  const db = await getDb(); if (!db || !invitationId) return [];
  return db.select().from(guestbookEntries).where(and(eq(guestbookEntries.invitationId, invitationId), eq(guestbookEntries.isHidden, 0))).orderBy(desc(guestbookEntries.createdAt)).limit(30);
}

const guestbookRate = new Map<string, number>();
export function canSubmitGuestbook(key: string) { const now = Date.now(); const last = guestbookRate.get(key) ?? 0; if (now - last < 15_000) return false; guestbookRate.set(key, now); return true; }

export async function createGuestbook(invitationId: number, authorName: string, message: string) {
  const db = await getDb(); if (!db || !invitationId) return { id: Date.now(), invitationId, authorName, message, isHidden: 0, createdAt: new Date() };
  await db.insert(guestbookEntries).values({ invitationId, authorName, message });
  const rows = await db.select().from(guestbookEntries).where(and(eq(guestbookEntries.invitationId, invitationId), eq(guestbookEntries.authorName, authorName))).orderBy(desc(guestbookEntries.createdAt)).limit(1);
  return rows[0];
}

export async function listAllGuestbook(invitationId: number) {
  const db = await getDb(); if (!db || !invitationId) return [];
  return db.select().from(guestbookEntries).where(eq(guestbookEntries.invitationId, invitationId)).orderBy(desc(guestbookEntries.createdAt));
}

export async function listRsvp(invitationId: number) {
  const db = await getDb(); if (!db || !invitationId) return [];
  return db.select().from(rsvpResponses).where(eq(rsvpResponses.invitationId, invitationId)).orderBy(desc(rsvpResponses.createdAt));
}

export async function createRsvp(data: Omit<typeof rsvpResponses.$inferInsert, "editToken"> & { editToken?: string }) {
  const db = await getDb(); const editToken = data.editToken ?? crypto.randomUUID();
  if (!db || !data.invitationId) return { ...data, id: Date.now(), editToken, createdAt: new Date(), updatedAt: new Date() };
  await db.insert(rsvpResponses).values({ ...data, editToken });
  const rows = await db.select().from(rsvpResponses).where(eq(rsvpResponses.editToken, editToken)).limit(1); return rows[0];
}

export async function updateGuestbookVisibility(id: number, hidden: boolean) {
  const db = await getDb(); if (!db) return;
  await db.update(guestbookEntries).set({ isHidden: hidden ? 1 : 0 }).where(eq(guestbookEntries.id, id));
}
export async function deleteGuestbook(id: number) { const db = await getDb(); if (db) await db.delete(guestbookEntries).where(eq(guestbookEntries.id, id)); }
