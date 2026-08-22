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

    const fileName = path.basename(key);
    // Check local static bundled media
    const candidatePaths = [
      path.resolve(import.meta.dirname, "../../client/public/manus-storage", fileName),
      path.resolve(import.meta.dirname, "../public/manus-storage", fileName),
      path.resolve(import.meta.dirname, "public/manus-storage", fileName),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return res.sendFile(p);
      }
    }

    // If Forge is configured, use it
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", key);

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
      const upstreamUrl = `https://doljanchi-t3vnch8e.manus.space/manus-storage/${key}`;
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
