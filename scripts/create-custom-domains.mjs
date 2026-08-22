async function query(token, q, variables = {}) {
  const res = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ query: q, variables })
  });
  return res.json();
}

async function main() {
  const token = "2f38e5b3-56cf-4c71-aae9-9db53f994cb9";
  const projectId = "37291353-76ce-4775-8e7b-8f68f0bde120";
  const environmentId = "7f8bf237-ee46-4a86-9525-a605fec0499c";
  const serviceId = "d45c4c37-1b85-486a-b5dd-e2363e5258d9";

  console.log("1. Adding Custom Domain invite.avocadoss.co.kr to Railway...");
  const customDomainMutation = `
    mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status {
          dnsRecords {
            recordType
            requiredValue
          }
        }
      }
    }
  `;

  const inviteRes = await query(token, customDomainMutation, {
    input: {
      projectId,
      environmentId,
      serviceId,
      domain: "invite.avocadoss.co.kr"
    }
  });
  console.log("Invite Domain result:", JSON.stringify(inviteRes, null, 2));

  console.log("2. Adding Custom Domain admin.avocadoss.co.kr to Railway...");
  const adminRes = await query(token, customDomainMutation, {
    input: {
      projectId,
      environmentId,
      serviceId,
      domain: "admin.avocadoss.co.kr"
    }
  });
  console.log("Admin Domain result:", JSON.stringify(adminRes, null, 2));
}

main().catch(console.error);
