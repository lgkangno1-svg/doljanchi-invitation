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
  const deploymentId = "6c5fb3e8-8e64-4a85-baf0-3e0c063b216d";

  const res = await query(token, `
    query deployment($id: String!) {
      deployment(id: $id) {
        id
        status
        createdAt
        updatedAt
        url
      }
    }
  `, { id: deploymentId });

  console.log("Deployment status:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
