import fs from "fs";

async function main() {
  const toml = fs.readFileSync(
    "C:\\Users\\tnfwo\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml",
    "utf-8"
  );
  const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!match) {
    console.error("No token found");
    return;
  }
  const token = match[1];

  console.log("Fetching zones for avocadoss.co.kr...");
  const res = await fetch("https://api.cloudflare.com/client/v4/zones?name=avocadoss.co.kr", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log("Zone response:", JSON.stringify(data, null, 2));

  if (data.result && data.result.length > 0) {
    const zoneId = data.result[0].id;
    console.log(`Zone ID: ${zoneId}`);

    const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dnsData = await dnsRes.json();
    console.log("Current DNS records:", JSON.stringify(dnsData, null, 2));
  }
}

main().catch(console.error);
