import fs from "fs";
import path from "path";

const baseDir = "C:\\Users\\tnfwo\\.gemini\\antigravity-ide\\scratch\\doljanchi-invitation\\client\\public\\manus-storage";
const invDir = path.join(baseDir, "invitations", "1");
fs.mkdirSync(invDir, { recursive: true });

fs.copyFileSync(
  path.join(baseDir, "1787323479492-chaewon-hotel-hero_a7c0aa2c.png"),
  path.join(invDir, "1787323479492-chaewon-hotel-hero_a7c0aa2c.png")
);

console.log("Copied hero into invitations/1!");
