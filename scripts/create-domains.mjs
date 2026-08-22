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
  const environmentId = "7f8bf237-ee46-4a86-9525-a605fec0499c";
  const serviceId = "d45c4c37-1b85-486a-b5dd-e2363e5258d9";
  const projectId = "37291353-76ce-4775-8e7b-8f68f0bde120";

  console.log("1. Creating Railway Public Domain (.up.railway.app)...");
  const serviceDomainMutation = `
    mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        domain
      }
    }
  `;
  const sDomainRes = await query(token, serviceDomainMutation, {
    input: {
      environmentId,
      serviceId
    }
  });
  console.log("Railway Domain:", JSON.stringify(sDomainRes, null, 2));

  console.log("2. Creating Custom Domains...");
  const customDomainMutation = `
    mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
      }
    }
  `;

  const inviteRes = await query(token, customDomainMutation, {
    input: {
      environmentId,
      serviceId,
      domain: "invite.avocadoss.co.kr"
    }
  });
  console.log("Custom Domain invite:", JSON.stringify(inviteRes, null, 2));

  const adminRes = await query(token, customDomainMutation, {
    input: {
      environmentId,
      serviceId,
      domain: "admin.avocadoss.co.kr"
    }
  });
  console.log("Custom Domain admin:", JSON.stringify(adminRes, null, 2));

  console.log("3. Querying Project Domains & Status...");
  const statusRes = await query(token, `
    query project($id: String!) {
      project(id: $id) {
        id
        name
        services {
          edges {
            node {
              id
              name
              customDomains {
                id
                domain
              }
              serviceDomains {
                domain
              }
            }
          }
        }
      }
    }
  `, { id: projectId });
  console.log("Domains status:", JSON.stringify(statusRes, null, 2));
}

main().catch(console.error);
