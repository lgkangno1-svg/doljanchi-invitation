import fs from "fs";
import path from "path";

async function main() {
  const origin = "https://doljanchi-t3vnch8e.manus.space";
  const inviteUrl = `${origin}/invite/invite-peach-ribbon-x7k2p`;

  console.log(`1. Fetching page HTML from ${inviteUrl}...`);
  const res = await fetch(inviteUrl);
  const html = await res.text();

  // Find all /manus-storage/...
  const storageMatches = html.match(/\/manus-storage\/[^"'\s<>)]+/g) || [];
  const mediaUrls = [...new Set(storageMatches)];
  console.log(`Found ${mediaUrls.length} storage media files:`, mediaUrls);

  // Also query trpc invitation.get
  console.log("2. Querying tRPC invitation.get API...");
  try {
    const trpcUrl = `${origin}/api/trpc/invitation.get?batch=1&input=%7B%220%22%3A%7B%22slug%22%3A%22invite-peach-ribbon-x7k2p%22%7D%7D`;
    const trpcRes = await fetch(trpcUrl);
    const trpcData = await trpcRes.json();
    console.log("tRPC Invitation Data:", JSON.stringify(trpcData, null, 2));

    const result = trpcData[0]?.result?.data;
    if (result) {
      fs.writeFileSync("scripts/original-invitation-backup.json", JSON.stringify(result, null, 2));
      console.log("Saved original invitation data to scripts/original-invitation-backup.json");

      // Extract hero and gallery URLs
      if (result.heroImageUrl) {
        try {
          const hero = JSON.parse(result.heroImageUrl);
          if (hero.url) mediaUrls.push(hero.url);
        } catch {
          mediaUrls.push(result.heroImageUrl);
        }
      }
      if (result.galleryImageUrls) {
        try {
          const gallery = JSON.parse(result.galleryImageUrls);
          if (Array.isArray(gallery)) {
            for (const item of gallery) {
              if (item.url) mediaUrls.push(item.url);
            }
          }
        } catch {}
      }
    }
  } catch (e) {
    console.error("tRPC fetch failed:", e);
  }

  const allMedia = [...new Set(mediaUrls)];
  console.log(`\n3. Total unique media to download: ${allMedia.length}`);

  const targetDir = path.resolve("client/public/manus-storage");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const relUrl of allMedia) {
    const cleanUrl = relUrl.split("?")[0];
    const fileName = path.basename(cleanUrl);
    const targetFile = path.join(targetDir, fileName);

    const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : `${origin}${cleanUrl}`;
    console.log(`Downloading ${fullUrl} -> ${fileName}...`);

    try {
      const resp = await fetch(fullUrl);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        fs.writeFileSync(targetFile, Buffer.from(buffer));
        console.log(`✅ Saved ${fileName} (${buffer.byteLength} bytes)`);
      } else {
        console.warn(`❌ Failed to download ${fullUrl}: HTTP ${resp.status}`);
      }
    } catch (err) {
      console.error(`❌ Error downloading ${fullUrl}:`, err);
    }
  }

  console.log("\n🎉 All media downloaded into client/public/manus-storage successfully!");
}

main().catch(console.error);
