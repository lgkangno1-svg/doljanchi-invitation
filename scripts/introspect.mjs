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
  const schemaRes = await query(token, `
    query {
      __type(name: "User") {
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `);
  console.log("User fields:", JSON.stringify(schemaRes, null, 2));

  const inputTypeRes = await query(token, `
    query {
      __type(name: "ProjectCreateInput") {
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `);
  console.log("ProjectCreateInput fields:", JSON.stringify(inputTypeRes, null, 2));
}

main().catch(console.error);
