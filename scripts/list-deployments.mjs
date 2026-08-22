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
  const serviceId = "d45c4c37-1b85-486a-b5dd-e2363e5258d9";
  const environmentId = "7f8bf237-ee46-4a86-9525-a605fec0499c";

  const deploymentsRes = await query(token, `
    query deployments($serviceId: String!, $environmentId: String!) {
      deployments(input: { serviceId: $serviceId, environmentId: $environmentId }) {
        edges {
          node {
            id
            status
            createdAt
            url
            meta
          }
        }
      }
    }
  `, { serviceId, environmentId });

  const list = deploymentsRes.data?.deployments?.edges || [];
  console.log(`Found ${list.length} deployments:`);
  for (const d of list) {
    console.log(`- ID: ${d.node.id}, Status: ${d.node.status}, CreatedAt: ${d.node.createdAt}`);
  }
}

main().catch(console.error);
