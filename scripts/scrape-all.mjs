import fs from "fs";
import path from "path";

async function main() {
  const origin = "https://doljanchi-t3vnch8e.manus.space";
  const slug = "invite-peach-ribbon-x7k2p";

  console.log("1. Fetching full invitation data via tRPC superjson format...");
  const rawInput = JSON.stringify({ "0": { json: { slug } } });
  const trpcUrl = `${origin}/api/trpc/invitation.get?batch=1&input=${encodeURIComponent(rawInput)}`;
  
  const trpcRes = await fetch(trpcUrl);
  const trpcData = await trpcRes.json();
  console.log("tRPC Response:", JSON.stringify(trpcData, null, 2));

  const invite = trpcData[0]?.result?.data?.json;
  const mediaUrls = [];

  if (invite) {
    fs.writeFileSync("scripts/original-invitation-backup.json", JSON.stringify(invite, null, 2));
    console.log("✅ Saved full invitation to scripts/original-invitation-backup.json");

    if (invite.heroImageUrl) {
      try {
        const h = JSON.parse(invite.heroImageUrl);
        if (h.url) mediaUrls.push(h.url);
      } catch {
        mediaUrls.push(invite.heroImageUrl);
      }
    }

    if (invite.galleryImageUrls) {
      try {
        const g = JSON.parse(invite.galleryImageUrls);
        if (Array.isArray(g)) {
          for (const item of g) {
            if (item.url) mediaUrls.push(item.url);
          }
        }
      } catch {}
    }
  }

  // Also scrape full HTML for audio, video, img tags
  console.log("2. Scraping HTML for audio, video, img tags...");
  const htmlRes = await fetch(`${origin}/invite/${slug}`);
  const html = await htmlRes.text();
  const allMatches = html.match(/\/manus-storage\/[^"'\s<>)]+/g) || [];
  for (const m of allMatches) mediaUrls.push(m);

  // Check common assets (BGM mp3, etc)
  const bgmMatches = html.match(/https?:\/\/[^"'\s<>]+\.(?:mp3|m4a|wav|webm|mp4)/gi) || [];
  for (const b of bgmMatches) mediaUrls.push(b);

  const uniqueMedia = [...new Set(mediaUrls)];
  console.log(`\nFound ${uniqueMedia.length} total media items to download:`, uniqueMedia);

  const targetDir = path.resolve("client/public/manus-storage");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const mediaUrl of uniqueMedia) {
    const cleanUrl = mediaUrl.split("?")[0];
    const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : `${origin}${cleanUrl}`;
    const fileName = path.basename(cleanUrl);
    const targetFile = path.join(targetDir, fileName);

    console.log(`Downloading ${fullUrl} -> ${fileName}...`);
    try {
      const resp = await fetch(fullUrl);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        fs.writeFileSync(targetFile, Buffer.from(buffer));
        console.log(`✅ Saved ${fileName} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`❌ HTTP ${resp.status} for ${fullUrl}`);
      }
    } catch (err) {
      console.error(`❌ Error downloading ${fullUrl}:`, err);
    }
  }

  console.log("\n🎉 Complete media extraction finished successfully!");
}

main().catch(console.error);
