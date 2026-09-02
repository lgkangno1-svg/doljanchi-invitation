import type { Express } from "express";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Preserve nested storage paths such as invitations/1/hero.png. The previous
    // basename-only lookup dropped the directory portion, so bundled hero images
    // existed inside dist/public but every /manus-storage/invitations/... request
    // still returned 404 before Express static serving could see it.
    const normalizedKey = key.replace(/\\/g, "/");
    const segments = normalizedKey.split("/");
    if (
      normalizedKey.startsWith("/") ||
      segments.some(segment => !segment || segment === "." || segment === "..")
    ) {
      res.status(400).send("Invalid storage key");
      return;
    }

    // Check local static bundled media first. The first path is used by the
    // production esbuild bundle (/app/dist/index.js + /app/dist/public/*).
    // The second path keeps local development working from server/_core.
    const candidatePaths = [
      path.resolve(import.meta.dirname, "public/manus-storage", normalizedKey),
      path.resolve(import.meta.dirname, "../../client/public/manus-storage", normalizedKey),
    ];

    for (const candidatePath of candidatePaths) {
      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return res.sendFile(candidatePath);
      }
    }

    // If Forge is configured, use it
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", normalizedKey);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (forgeResp.ok) {
          const { url } = (await forgeResp.json()) as { url: string };
          if (url) {
            res.set("Cache-Control", "no-store");
            return res.redirect(307, url);
          }
        }
      } catch (err) {
        console.warn("[StorageProxy] Forge presign failed, falling back to upstream:", err);
      }
    }

    // Upstream fallback to original live Manus storage
    try {
      const upstreamUrl = `https://doljanchi-t3vnch8e.manus.space/manus-storage/${normalizedKey}`;
      const upstreamResp = await fetch(upstreamUrl);
      if (upstreamResp.ok) {
        const contentType = upstreamResp.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        const arrayBuf = await upstreamResp.arrayBuffer();
        return res.send(Buffer.from(arrayBuf));
      }
    } catch (upstreamErr) {
      console.error("[StorageProxy] Upstream fallback failed:", upstreamErr);
    }

    res.status(404).send("Media asset not found");
  });
}
