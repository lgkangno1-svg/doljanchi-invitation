async function main() {
  const apiKey = "cfk_SEV2BRIr7XfLGe3S2Xks5GyuFhtxbGG4u7KzeNzHd1e9a62e";
  const email = "lg.kangno1@gmail.com";
  const accountId = "900930ccb5de33dcf3a1d50dde04fd92";
  const projectName = "chaewon-invitation";

  const headers = {
    "X-Auth-Email": email,
    "X-Auth-Key": apiKey,
    "Content-Type": "application/json"
  };

  for (const domain of ["invite.avocadoss.co.kr", "admin.avocadoss.co.kr"]) {
    console.log(`Retriggering validation for ${domain}...`);
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}/retry_validation`, {
      method: "POST",
      headers
    });
    console.log(`Result for ${domain}:`, JSON.stringify(await res.json(), null, 2));
  }
}

main().catch(console.error);
