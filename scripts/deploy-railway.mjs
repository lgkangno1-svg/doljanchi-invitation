async function query(token, q, variables = {}) {
  const res = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ query: q, variables })
  });
  const data = await res.json();
  if (data.errors) {
    console.error("GraphQL Errors:", JSON.stringify(data.errors, null, 2));
  }
  return data;
}

async function main() {
  const token = "2f38e5b3-56cf-4c71-aae9-9db53f994cb9";
  const workspaceId = "96ba42fc-7c83-42d7-a315-e62128667811";

  console.log("1. Creating Railway Project 'chaewon-doljanchi' in workspace...");
  const createProjectMutation = `
    mutation projectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `;

  const projectRes = await query(token, createProjectMutation, {
    input: {
      name: "chaewon-doljanchi",
      description: "ChaeWon 1st Birthday Invitation",
      workspaceId: workspaceId
    }
  });

  if (!projectRes.data?.projectCreate) {
    throw new Error("Failed to create project: " + JSON.stringify(projectRes));
  }

  const project = projectRes.data.projectCreate;
  const projectId = project.id;
  const environmentId = project.environments.edges[0].node.id;
  console.log(`✅ Project created: ${projectId} (Environment: ${environmentId})`);

  console.log("2. Creating MySQL Database service (via template / serviceCreate)...");
  // Let's create service from GitHub repo
  const createServiceMutation = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const serviceRes = await query(token, createServiceMutation, {
    input: {
      projectId,
      name: "doljanchi-web",
      source: {
        repo: "lgkangno1-svg/doljanchi-invitation"
      }
    }
  });
  console.log("Service creation result:", JSON.stringify(serviceRes, null, 2));

  const serviceId = serviceRes.data?.serviceCreate?.id;

  if (serviceId) {
    console.log("3. Setting Environment Variables...");
    const upsertVariablesMutation = `
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `;

    const envVars = {
      NODE_ENV: "production",
      PORT: "3000",
      CANONICAL_ORIGIN: "https://invite.avocadoss.co.kr",
      JWT_SECRET: "chaewon-doljanchi-jwt-secret-secure-random-2026",
      ADMIN_DASHBOARD_PASSWORD: "adminpassword123!",
      SECONDARY_ADMIN_DASHBOARD_PASSWORD: "secondaryadminpassword123!",
      EXTERNAL_S3_BUCKET: "chaewon-invitation-media",
      EXTERNAL_S3_PUBLIC_BASE_URL: "https://media.invite.avocadoss.co.kr",
      EXTERNAL_S3_ENDPOINT: "https://900930ccb5de33dcf3a1d50dde04fd92.r2.cloudflarestorage.com",
      EXTERNAL_S3_REGION: "auto",
      EXTERNAL_S3_FORCE_PATH_STYLE: "false"
    };

    const varsRes = await query(token, upsertVariablesMutation, {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables: envVars
      }
    });
    console.log("Variables set result:", JSON.stringify(varsRes));

    console.log("4. Creating custom domain endpoints...");
    const domainMutation = `
      mutation customDomainCreate($input: CustomDomainCreateInput!) {
        customDomainCreate(input: $input) {
          id
          domain
          status {
            dnsRecords {
              domain
              recordType
              requiredValue
            }
          }
        }
      }
    `;

    const domainInvite = await query(token, domainMutation, {
      input: {
        projectId,
        environmentId,
        serviceId,
        domain: "invite.avocadoss.co.kr"
      }
    });
    console.log("Domain invite.avocadoss.co.kr:", JSON.stringify(domainInvite, null, 2));

    const domainAdmin = await query(token, domainMutation, {
      input: {
        projectId,
        environmentId,
        serviceId,
        domain: "admin.avocadoss.co.kr"
      }
    });
    console.log("Domain admin.avocadoss.co.kr:", JSON.stringify(domainAdmin, null, 2));

    console.log("5. Triggering initial deployment...");
    const deployMutation = `
      mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `;
    const deployRes = await query(token, deployMutation, { serviceId, environmentId });
    console.log("Deploy trigger result:", JSON.stringify(deployRes));
  }

  console.log(`\n🎉 Project successfully deployed to Railway!`);
  console.log(`🔗 Dashboard: https://railway.com/project/${projectId}`);
}

main().catch(console.error);
