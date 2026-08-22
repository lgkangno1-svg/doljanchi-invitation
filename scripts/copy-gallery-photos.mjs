import fs from "fs";
import path from "path";

const src1 = "C:\\Users\\tnfwo\\.gemini\\antigravity-ide\\brain\\e626cb6b-8e47-4212-be1b-cf1ebcfb5d9a\\.user_uploaded\\media_1787392806325.jpg";
const src2 = "C:\\Users\\tnfwo\\.gemini\\antigravity-ide\\brain\\e626cb6b-8e47-4212-be1b-cf1ebcfb5d9a\\.user_uploaded\\media_1787392806552.jpg";

const destDir = "C:\\Users\\tnfwo\\.gemini\\antigravity-ide\\scratch\\doljanchi-invitation\\client\\public\\manus-storage";

fs.copyFileSync(src1, path.join(destDir, "chaewon-gallery-feet.jpg"));
fs.copyFileSync(src2, path.join(destDir, "chaewon-gallery-hands.jpg"));

console.log("Images successfully copied to client/public/manus-storage!");
