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

  console.log("1. Adding MySQL Service with docker image mysql:8.0...");
  const createServiceMutation = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `;

  const mysqlRes = await query(token, createServiceMutation, {
    input: {
      projectId,
      name: "MySQL",
      source: {
        image: "mysql:8.0"
      }
    }
  });
  console.log("MySQL Service:", JSON.stringify(mysqlRes, null, 2));

  const mysqlServiceId = mysqlRes.data?.serviceCreate?.id;

  if (mysqlServiceId) {
    console.log("2. Setting MySQL Environment Variables & Volume...");
    const upsertVariablesMutation = `
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `;

    const mysqlVars = {
      MYSQL_ROOT_PASSWORD: "rootpassword123!",
      MYSQL_DATABASE: "chaewon_invitation",
      MYSQL_USER: "chaewon_user",
      MYSQL_PASSWORD: "securepassword123!",
      MYSQLPORT: "3306"
    };

    const varsRes = await query(token, upsertVariablesMutation, {
      input: {
        projectId,
        environmentId,
        serviceId: mysqlServiceId,
        variables: mysqlVars
      }
    });
    console.log("MySQL variables set:", JSON.stringify(varsRes));

    console.log("3. Connecting Web Service DATABASE_URL to MySQL...");
    const webServiceId = "d45c4c37-1b85-486a-b5dd-e2363e5258d9";
    const updateWebVars = await query(token, upsertVariablesMutation, {
      input: {
        projectId,
        environmentId,
        serviceId: webServiceId,
        variables: {
          DATABASE_URL: `mysql://chaewon_user:securepassword123!@MySQL.railway.internal:3306/chaewon_invitation`
        }
      }
    });
    console.log("Web service DATABASE_URL set:", JSON.stringify(updateWebVars));
  }

  console.log("\n✅ MySQL Database service configured and linked!");
}

main().catch(console.error);
