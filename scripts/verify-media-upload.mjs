import fs from "node:fs/promises";
import path from "node:path";
import { appRouter } from "../server/routers.ts";

const asset = path.resolve("/home/ubuntu/webdev-static-assets/chaewon-hotel-hero.jpg");
const bytes = await fs.readFile(asset);
const caller = appRouter.createCaller({
  user: { id: 1, openId: "verification-admin", name: "Verification Admin", email: null, loginMethod: "verification", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
});

const media = await caller.admin.uploadMedia({
  fileName: "chaewon-hotel-hero.png",
  mimeType: "image/png",
  dataBase64: bytes.toString("base64"),
});
await caller.admin.saveMedia({ hero: media, gallery: [media] });
console.log(JSON.stringify({ url: media.url, kind: media.kind }));
