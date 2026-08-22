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

  console.log("1. Updating service source to lgkangno1-svg/doljanchi-invitation main branch...");
  const updateServiceMutation = `
    mutation serviceUpdate($id: String!, $input: ServiceUpdateInput!) {
      serviceUpdate(id: $id, input: $input) {
        id
        name
      }
    }
  `;

  const updateRes = await query(token, updateServiceMutation, {
    id: serviceId,
    input: {
      source: {
        repo: "lgkangno1-svg/doljanchi-invitation"
      }
    }
  });
  console.log("Update service result:", JSON.stringify(updateRes, null, 2));

  console.log("2. Triggering deployment now...");
  const deployMutation = `
    mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `;
  const deployRes = await query(token, deployMutation, { serviceId, environmentId });
  console.log("Deployment trigger result:", JSON.stringify(deployRes, null, 2));

  console.log("3. Checking deployment status...");
  const deploymentsRes = await query(token, `
    query deployments($serviceId: String!, $environmentId: String!) {
      deployments(input: { serviceId: $serviceId, environmentId: $environmentId }) {
        edges {
          node {
            id
            status
            createdAt
            url
          }
        }
      }
    }
  `, { serviceId, environmentId });
  console.log("Current deployments:", JSON.stringify(deploymentsRes, null, 2));
}

main().catch(console.error);
