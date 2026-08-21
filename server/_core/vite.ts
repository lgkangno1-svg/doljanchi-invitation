import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getOrCreateInvitation } from "../db";
import { absoluteShareUrl, resolveShareImage } from "../shareMeta";

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
async function sharingHead(originalUrl: string, requestOrigin?: string) {
  const title = "채원의 첫 번째 생일에 초대합니다";
  const description = "2026년 10월 18일, 코트야드 메리어트 서울 명동에서 열리는 채원이의 첫 번째 생일에 소중한 분들을 초대합니다.";
  const fallbackImage = "/manus-storage/chaewon-hotel-hero_a8c12ed8.jpg";
  let image = fallbackImage;
  const slug = originalUrl.split("?")[0]?.match(/^\/invite\/([^/]+)$/)?.[1];
  if (slug) {
    try {
      const invitation = await getOrCreateInvitation(decodeURIComponent(slug));
      image = resolveShareImage(invitation.heroImageUrl, fallbackImage);
    } catch { /* Preserve a valid default preview if the database is temporarily unavailable. */ }
  }
  const origin = process.env.CANONICAL_ORIGIN?.replace(/\/$/, "") || requestOrigin?.replace(/\/$/, "");
  const ogImage = absoluteShareUrl(origin, image);
  const canonical = origin ? absoluteShareUrl(origin, originalUrl.split("?")[0] || "/") : "";
  return `<title>${esc(title)}</title><meta name="description" content="${esc(description)}" /><meta name="robots" content="noindex, nofollow" /><meta property="og:type" content="website" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" /><meta property="og:image" content="${esc(ogImage)}" /><meta property="og:image:alt" content="채원의 첫 번째 생일 초대장" />${canonical ? `<meta property="og:url" content="${esc(canonical)}" /><link rel="canonical" href="${esc(canonical)}" />` : ""}`;
}
const inject = async (template: string, originalUrl: string, appHtml = "", requestOrigin?: string) => template.replace("<!--app-head-->", await sharingHead(originalUrl, requestOrigin)).replace("<!--app-html-->", () => appHtml).replace("src=\"/src/entry-client.tsx\"", `src="/src/entry-client.tsx?v=${nanoid()}"`);

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const }, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => { try { const templatePath = path.resolve(import.meta.dirname, "../..", "client", "index.html"); let template = await fs.promises.readFile(templatePath, "utf-8"); template = await vite.transformIndexHtml(req.originalUrl, template); const mod = await vite.ssrLoadModule("/src/entry-server.tsx"); const rendered = await mod.render(req.originalUrl); const protocol = req.header("x-forwarded-proto")?.split(",")[0] || req.protocol; const requestOrigin = `${protocol}://${req.get("host")}`; res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(await inject(template, req.originalUrl, rendered.html, requestOrigin)); } catch (e) { vite.ssrFixStacktrace(e as Error); next(e); } });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", async (req, res) => { const file = path.resolve(distPath, "index.html"); if (!fs.existsSync(file)) return res.status(404).send("Not found"); const template = fs.readFileSync(file, "utf-8"); const protocol = req.header("x-forwarded-proto")?.split(",")[0] || req.protocol; const requestOrigin = `${protocol}://${req.get("host")}`; res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).send(await inject(template, req.originalUrl, "", requestOrigin)); });
}
