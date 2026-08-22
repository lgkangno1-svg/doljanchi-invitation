import fs from "fs";

async function main() {
  const toml = fs.readFileSync(
    "C:\\Users\\tnfwo\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml",
    "utf-8"
  );
  const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
  const token = match[1];
  const accountId = "900930ccb5de33dcf3a1d50dde04fd92";
  const projectName = "chaewon-invitation";

  console.log("1. Binding D1 database chaewon_db to Cloudflare Pages project...");
  const patchRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      deployment_configs: {
        production: {
          d1_databases: {
            chaewon_db: {
              id: "8a71af4c-0e0f-4fc1-ab93-97cc5dae62f6"
            }
          }
        },
        preview: {
          d1_databases: {
            chaewon_db: {
              id: "8a71af4c-0e0f-4fc1-ab93-97cc5dae62f6"
            }
          }
        }
      }
    })
  });
  const patchData = await patchRes.json();
  console.log("D1 Binding result:", JSON.stringify(patchData, null, 2));

  console.log("2. Adding custom domain invite.avocadoss.co.kr to Pages project...");
  const inviteRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "invite.avocadoss.co.kr"
    })
  });
  const inviteData = await inviteRes.json();
  console.log("Domain invite.avocadoss.co.kr result:", JSON.stringify(inviteData, null, 2));

  console.log("3. Adding custom domain admin.avocadoss.co.kr to Pages project...");
  const adminRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "admin.avocadoss.co.kr"
    })
  });
  const adminData = await adminRes.json();
  console.log("Domain admin.avocadoss.co.kr result:", JSON.stringify(adminData, null, 2));
}

main().catch(console.error);
