import fs from "fs";

async function main() {
  const toml = fs.readFileSync(
    "C:\\Users\\tnfwo\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml",
    "utf-8"
  );
  const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
  const token = match[1];
  const zoneId = "9adf7cd9cc9f5949b56518c6093fd47d";

  console.log("1. Trying to add CNAME for invite.avocadoss.co.kr -> nii01vqz.up.railway.app...");
  const inviteRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "CNAME",
      name: "invite",
      content: "nii01vqz.up.railway.app",
      ttl: 1,
      proxied: false
    })
  });
  const inviteData = await inviteRes.json();
  console.log("Cloudflare invite CNAME result:", JSON.stringify(inviteData, null, 2));

  console.log("2. Trying to add CNAME for admin.avocadoss.co.kr -> nii01vqz.up.railway.app...");
  const adminRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "CNAME",
      name: "admin",
      content: "nii01vqz.up.railway.app",
      ttl: 1,
      proxied: false
    })
  });
  const adminData = await adminRes.json();
  console.log("Cloudflare admin CNAME result:", JSON.stringify(adminData, null, 2));
}

main().catch(console.error);
