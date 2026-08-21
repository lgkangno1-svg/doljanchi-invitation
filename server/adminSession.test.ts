import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ADMIN_SESSION_COOKIE, hasAdministratorSession } from "./adminSession";

function credentialContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string }> } {
  const cookies: Array<{ name: string; value: string }> = [];
  return { ctx: { user: null, adminSession: false, req: { headers: {} } as TrpcContext["req"], res: { cookie: (name: string, value: string) => cookies.push({ name, value }), clearCookie: () => undefined } as TrpcContext["res"] }, cookies };
}

describe("administrator credential login", () => {
  it("accepts the configured protected password through the admin login procedure", async () => {
    const password = process.env.ADMIN_DASHBOARD_PASSWORD;
    expect(password).toBeTruthy();
    const { ctx, cookies } = credentialContext();
    const result = await appRouter.createCaller(ctx).adminAuth.login({ username: "tnfwod", password: password! });
    expect(result).toEqual({ success: true });
    expect(cookies[0]?.name).toBe("doljanchi_admin_session");
    expect(cookies[0]?.value).toContain(".");
    expect(await hasAdministratorSession(`${ADMIN_SESSION_COOKIE}=${cookies[0]?.value}`)).toBe(true);
  });
});
