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

  console.log("Updating Railway Admin Passwords (1234 -> 4321)...");
  const upsertVariablesMutation = `
    mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `;

  const res = await query(token, upsertVariablesMutation, {
    input: {
      projectId,
      environmentId,
      serviceId,
      variables: {
        ADMIN_DASHBOARD_PASSWORD: "4321",
        SECONDARY_ADMIN_DASHBOARD_PASSWORD: "4321"
      }
    }
  });

  console.log("Variables update result:", JSON.stringify(res));

  console.log("Triggering deployment with updated variables...");
  const deployMutation = `
    mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `;
  const deployRes = await query(token, deployMutation, { serviceId, environmentId });
  console.log("Deployment trigger result:", JSON.stringify(deployRes));
}

main().catch(console.error);
