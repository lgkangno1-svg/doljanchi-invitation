import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { safeMediaFileName, validateMediaUpload } from "./media";
import { TRPCError } from "@trpc/server";
import { ADMIN_SESSION_COOKIE, administratorCookieOptions, createAdministratorSession, verifyAdministratorCredentials } from "./adminSession";

const invitationInput = z.object({
  babyName: z.string().trim().min(1).max(80), fatherName: z.string().trim().min(1).max(120), motherName: z.string().trim().min(1).max(120), invitationTitle: z.string().trim().min(1).max(180), greeting: z.string().trim().min(1).max(2000),
  eventDate: z.string().trim().min(1).max(32), eventTime: z.string().trim().min(1).max(64), venueName: z.string().trim().min(1).max(160), venueAddress: z.string().trim().min(1).max(255), parkingInfo: z.string().trim().min(1).max(1000), accountInfo: z.string().trim().min(1).max(1000),
});
const mediaItemInput = z.object({ url: z.string().startsWith("/manus-storage/"), kind: z.enum(["image", "video"]), mimeType: z.string().max(80), fileName: z.string().max(140) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const options = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...options, maxAge: -1 }); return { success: true } as const; }),
  }),
  adminAuth: router({
    status: publicProcedure.query(({ ctx }) => ({ authenticated: ctx.adminSession })),
    login: publicProcedure.input(z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(200) })).mutation(async ({ input, ctx }) => {
      if (!verifyAdministratorCredentials(input.username, input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "아이디 또는 비밀번호를 확인해 주세요." });
      const token = await createAdministratorSession(); ctx.res.cookie(ADMIN_SESSION_COOKIE, token, administratorCookieOptions());
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(ADMIN_SESSION_COOKIE, administratorCookieOptions()); return { success: true }; }),
  }),
  invitation: router({
    get: publicProcedure.input(z.object({ slug: z.string().trim().min(8).max(96) })).query(({ input }) => db.getOrCreateInvitation(input.slug)),
    guestbook: publicProcedure.input(z.object({ slug: z.string().trim().min(8).max(96) })).query(async ({ input }) => { const invite = await db.getOrCreateInvitation(input.slug); return db.listGuestbook(invite.id); }),
    addGuestbook: publicProcedure.input(z.object({ name: z.string().trim().min(1, "이름을 입력해 주세요.").max(40), companionNames: z.array(z.string().trim().min(1).max(40)).max(9).default([]), message: z.string().trim().min(1, "축하 메시지를 입력해 주세요.").max(300), website: z.string().max(0).optional() })).mutation(async ({ input }) => { if (input.website) throw new Error("Spam blocked"); const invite = await db.getOrCreateInvitation(); if (!db.canSubmitGuestbook(`${invite.slug}:${input.name}`)) throw new Error("잠시 후 다시 시도해 주세요."); return db.createGuestbook(invite.id, input.name, input.message, input.companionNames); }),
    addRsvp: publicProcedure.input(z.object({ name: z.string().trim().min(1).max(80), companionNames: z.array(z.string().trim().min(1).max(80)).max(19).default([]), attendance: z.enum(["attending", "unable"]), adults: z.number().int().min(0).max(10), children: z.number().int().min(0).max(10), meal: z.boolean(), contact: z.string().trim().max(40).optional(), note: z.string().trim().max(300).optional() })).mutation(async ({ input }) => { const invite = await db.getOrCreateInvitation(); return db.createRsvp({ ...input, invitationId: invite.id, companionNames: JSON.stringify(input.companionNames), meal: input.meal ? 1 : 0, contact: input.contact || null, note: input.note || null }); }),
  }),
  admin: router({
    dashboard: adminProcedure.query(async () => { const invite = await db.getOrCreateInvitation(); const [guestbook, rsvps] = await Promise.all([db.listAllGuestbook(invite.id), db.listRsvp(invite.id)]); return { invitation: invite, guestbook, rsvps }; }),
    updateInvitation: adminProcedure.input(invitationInput).mutation(({ input }) => db.updateInvitation(input)),
    uploadMedia: adminProcedure.input(z.object({ fileName: z.string().min(1).max(140), mimeType: z.string().min(1).max(80), dataBase64: z.string().min(1).max(42_000_000) })).mutation(async ({ input, ctx }) => {
      const { data, kind } = validateMediaUpload(input.fileName, input.mimeType, input.dataBase64);
      const safeName = safeMediaFileName(input.fileName);
      const stored = await storagePut(`invitations/${ctx.user?.id ?? "private-admin"}/${Date.now()}-${safeName}`, data, input.mimeType);
      return { url: stored.url, kind, mimeType: input.mimeType, fileName: input.fileName };
    }),
    saveMedia: adminProcedure.input(z.object({ hero: mediaItemInput.nullable(), gallery: z.array(mediaItemInput).max(8) })).mutation(({ input }) => db.updateInvitationMedia(input.hero ? JSON.stringify(input.hero) : null, JSON.stringify(input.gallery))),
    hideGuestbook: adminProcedure.input(z.object({ id: z.number().int(), hidden: z.boolean() })).mutation(({ input }) => db.updateGuestbookVisibility(input.id, input.hidden)),
    deleteGuestbook: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteGuestbook(input.id)),
  }),
});
export type AppRouter = typeof appRouter;
