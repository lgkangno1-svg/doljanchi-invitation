import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const invitationInput = z.object({
  babyName: z.string().trim().min(1).max(80), fatherName: z.string().trim().min(1).max(120), motherName: z.string().trim().min(1).max(120), invitationTitle: z.string().trim().min(1).max(180), greeting: z.string().trim().min(1).max(2000),
  eventDate: z.string().trim().min(1).max(32), eventTime: z.string().trim().min(1).max(64), venueName: z.string().trim().min(1).max(160), venueAddress: z.string().trim().min(1).max(255), parkingInfo: z.string().trim().min(1).max(1000), accountInfo: z.string().trim().min(1).max(1000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const options = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...options, maxAge: -1 }); return { success: true } as const; }),
  }),
  invitation: router({
    get: publicProcedure.input(z.object({ slug: z.string().trim().min(8).max(96) })).query(({ input }) => db.getOrCreateInvitation(input.slug)),
    guestbook: publicProcedure.input(z.object({ slug: z.string().trim().min(8).max(96) })).query(async ({ input }) => { const invite = await db.getOrCreateInvitation(input.slug); return db.listGuestbook(invite.id); }),
    addGuestbook: publicProcedure.input(z.object({ name: z.string().trim().min(1, "이름을 입력해 주세요.").max(40), message: z.string().trim().min(1, "축하 메시지를 입력해 주세요.").max(300), website: z.string().max(0).optional() })).mutation(async ({ input }) => { if (input.website) throw new Error("Spam blocked"); const invite = await db.getOrCreateInvitation(); if (!db.canSubmitGuestbook(`${invite.slug}:${input.name}`)) throw new Error("잠시 후 다시 시도해 주세요."); return db.createGuestbook(invite.id, input.name, input.message); }),
    addRsvp: publicProcedure.input(z.object({ name: z.string().trim().min(1).max(80), attendance: z.enum(["attending", "unable"]), adults: z.number().int().min(0).max(10), children: z.number().int().min(0).max(10), meal: z.boolean(), contact: z.string().trim().max(40).optional(), note: z.string().trim().max(300).optional() })).mutation(async ({ input }) => { const invite = await db.getOrCreateInvitation(); return db.createRsvp({ ...input, invitationId: invite.id, meal: input.meal ? 1 : 0, contact: input.contact || null, note: input.note || null }); }),
  }),
  admin: router({
    dashboard: adminProcedure.query(async () => { const invite = await db.getOrCreateInvitation(); const [guestbook, rsvps] = await Promise.all([db.listAllGuestbook(invite.id), db.listRsvp(invite.id)]); return { invitation: invite, guestbook, rsvps }; }),
    updateInvitation: adminProcedure.input(invitationInput).mutation(({ input }) => db.updateInvitation(input)),
    hideGuestbook: adminProcedure.input(z.object({ id: z.number().int(), hidden: z.boolean() })).mutation(({ input }) => db.updateGuestbookVisibility(input.id, input.hidden)),
    deleteGuestbook: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.deleteGuestbook(input.id)),
  }),
});
export type AppRouter = typeof appRouter;
