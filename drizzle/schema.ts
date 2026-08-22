import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  babyName: varchar("babyName", { length: 80 }).notNull(),
  fatherName: varchar("fatherName", { length: 120 }).notNull(),
  motherName: varchar("motherName", { length: 120 }).notNull(),
  invitationTitle: varchar("invitationTitle", { length: 180 }).notNull(),
  greeting: text("greeting").notNull(),
  eventDate: varchar("eventDate", { length: 32 }).notNull(),
  eventTime: varchar("eventTime", { length: 64 }).notNull(),
  venueName: varchar("venueName", { length: 160 }).notNull(),
  venueAddress: varchar("venueAddress", { length: 255 }).notNull(),
  parkingInfo: text("parkingInfo").notNull(),
  heroImageUrl: text("heroImageUrl"),
  galleryImageUrls: text("galleryImageUrls"),
  accountInfo: text("accountInfo").notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const guestbookEntries = mysqlTable("guestbook_entries", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  authorName: varchar("authorName", { length: 40 }).notNull(),
  companionNames: varchar("companionNames", { length: 2048 }).notNull().default("[]"),
  message: varchar("message", { length: 500 }).notNull(),
  isHidden: int("isHidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rsvpResponses = mysqlTable("rsvp_responses", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull(),
  editToken: varchar("editToken", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  companionNames: varchar("companionNames", { length: 2048 }).notNull().default("[]"),
  attendeeDetails: varchar("attendeeDetails", { length: 4096 }).notNull().default("[]"),
  attendance: mysqlEnum("attendance", ["attending", "unable"]).notNull(),
  adults: int("adults").default(0).notNull(),
  children: int("children").default(0).notNull(),
  meal: int("meal").default(1).notNull(),
  contact: varchar("contact", { length: 40 }),
  note: varchar("note", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;
