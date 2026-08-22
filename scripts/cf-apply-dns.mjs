async function main() {
  const email = "lg.kangno1@gmail.com";
  const apiKey = "cfk_SEV2BRIr7XfLGe3S2Xks5GyuFhtxbGG4u7KzeNzHd1e9a62e";
  const zoneId = "9adf7cd9cc9f5949b56518c6093fd47d";

  console.log("1. Testing Cloudflare Auth with Global API Key / Token...");
  
  // Try with X-Auth-Key / X-Auth-Email first, and Bearer token fallback
  let headers = {
    "X-Auth-Email": email,
    "X-Auth-Key": apiKey,
    "Content-Type": "application/json"
  };

  let testRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers });
  let testData = await testRes.json();

  if (!testData.success) {
    console.log("Trying Bearer token auth...");
    headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };
    testRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers });
    testData = await testRes.json();
  }

  console.log("Zone Auth Result:", JSON.stringify(testData, null, 2));

  if (!testData.success) {
    throw new Error("Cloudflare Auth failed: " + JSON.stringify(testData.errors));
  }

  console.log("2. Fetching existing DNS records for avocadoss.co.kr...");
  const dnsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { headers });
  const dnsData = await dnsRes.json();
  console.log("Current DNS records:", JSON.stringify(dnsData.result?.map(r => ({ id: r.id, name: r.name, type: r.type, content: r.content, proxied: r.proxied })), null, 2));

  const targetCname = "chaewon-invitation.pages.dev";

  for (const sub of ["invite", "admin"]) {
    const fullName = `${sub}.avocadoss.co.kr`;
    const existing = dnsData.result?.find(r => r.name === fullName);

    if (existing) {
      console.log(`3. Updating existing DNS record for ${fullName} -> ${targetCname}...`);
      const updateRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          type: "CNAME",
          name: sub,
          content: targetCname,
          ttl: 1,
          proxied: true
        })
      });
      console.log(`Updated ${fullName}:`, JSON.stringify(await updateRes.json(), null, 2));
    } else {
      console.log(`3. Creating new DNS CNAME record for ${fullName} -> ${targetCname}...`);
      const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "CNAME",
          name: sub,
          content: targetCname,
          ttl: 1,
          proxied: true
        })
      });
      console.log(`Created ${fullName}:`, JSON.stringify(await createRes.json(), null, 2));
    }
  }

  console.log("\n🎉 DNS configuration completed successfully!");
}

main().catch(console.error);
