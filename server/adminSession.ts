import crypto from "node:crypto";
import { parse } from "cookie";
import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const ADMIN_SESSION_COOKIE = "doljanchi_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function secretKey() { return new TextEncoder().encode(ENV.cookieSecret); }

export function verifyAdministratorCredentials(username: string, password: string) {
  const expectedUsername = "tnfwod";
  const expectedPassword = ENV.adminDashboardPassword;
  if (!expectedPassword || username !== expectedUsername) return false;
  const submitted = Buffer.from(password); const expected = Buffer.from(expectedPassword);
  return submitted.length === expected.length && crypto.timingSafeEqual(submitted, expected);
}

export async function createAdministratorSession() {
  return new SignJWT({ role: "private-admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`).sign(secretKey());
}

export async function hasAdministratorSession(cookieHeader?: string) {
  const token = parse(cookieHeader ?? "")[ADMIN_SESSION_COOKIE];
  if (!token || !ENV.cookieSecret) return false;
  try { const { payload } = await jwtVerify(token, secretKey()); return payload.role === "private-admin"; } catch { return false; }
}

export function administratorCookieOptions() {
  return { httpOnly: true, secure: ENV.isProduction, sameSite: "lax" as const, path: "/", maxAge: SESSION_SECONDS * 1000 };
}
