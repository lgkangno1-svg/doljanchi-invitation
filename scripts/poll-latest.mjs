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
  const deploymentId = "95903a41-e92f-4980-8f7c-67eaf5188834";

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

  console.log("Deployment status:", res.data?.deployment?.status);
}

main().catch(console.error);
