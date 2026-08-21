import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const head = () => { const title = "채원의 첫 번째 생일에 초대합니다"; const description = "2026년 10월 18일, 코트야드 메리어트 서울 명동에서 열리는 채원이의 첫 번째 생일에 소중한 분들을 초대합니다."; const image = process.env.CANONICAL_ORIGIN ? `${process.env.CANONICAL_ORIGIN}/manus-storage/chaewon-hotel-hero_a8c12ed8.jpg` : "/manus-storage/chaewon-hotel-hero_a8c12ed8.jpg"; return `<title>${esc(title)}</title><meta name="description" content="${esc(description)}" /><meta name="robots" content="noindex, nofollow" /><meta property="og:type" content="website" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:alt" content="채원의 첫 번째 생일 초대장" />${process.env.CANONICAL_ORIGIN ? `<meta property="og:url" content="${esc(process.env.CANONICAL_ORIGIN)}" /><link rel="canonical" href="${esc(process.env.CANONICAL_ORIGIN)}" />` : ""}`; };
const inject = (template: string, appHtml = "") => template.replace("<!--app-head-->", head()).replace("<!--app-html-->", () => appHtml).replace("src=\"/src/entry-client.tsx\"", `src="/src/entry-client.tsx?v=${nanoid()}"`);

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const }, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => { try { const templatePath = path.resolve(import.meta.dirname, "../..", "client", "index.html"); let template = await fs.promises.readFile(templatePath, "utf-8"); template = await vite.transformIndexHtml(req.originalUrl, template); const mod = await vite.ssrLoadModule("/src/entry-server.tsx"); const rendered = await mod.render(req.originalUrl); res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(inject(template, rendered.html)); } catch (e) { vite.ssrFixStacktrace(e as Error); next(e); } });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", (_req, res) => { const file = path.resolve(distPath, "index.html"); if (!fs.existsSync(file)) return res.status(404).send("Not found"); const template = fs.readFileSync(file, "utf-8"); res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).send(inject(template)); });
}
