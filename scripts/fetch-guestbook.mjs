import fs from "fs";

async function main() {
  const origin = "https://doljanchi-t3vnch8e.manus.space";
  const slug = "invite-peach-ribbon-x7k2p";

  console.log("Fetching guestbook from original site...");
  const rawInput = JSON.stringify({ "0": { json: { slug } } });
  const guestbookUrl = `${origin}/api/trpc/invitation.guestbook?batch=1&input=${encodeURIComponent(rawInput)}`;
  
  const gbRes = await fetch(guestbookUrl);
  const gbData = await gbRes.json();
  const guestbookEntries = gbData[0]?.result?.data?.json || [];
  console.log(`Found ${guestbookEntries.length} guestbook entries:`, guestbookEntries);

  const fullBackup = {
    invitation: JSON.parse(fs.readFileSync("scripts/original-invitation-backup.json", "utf-8")),
    guestbook: guestbookEntries,
    rsvps: []
  };

  fs.writeFileSync("scripts/full-production-backup.json", JSON.stringify(fullBackup, null, 2));
  console.log("✅ Complete backup written to scripts/full-production-backup.json");
}

main().catch(console.error);
