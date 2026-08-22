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
  const domainTypeRes = await query(token, `
    query {
      __type(name: "CustomDomain") {
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
  console.log("CustomDomain fields:", JSON.stringify(domainTypeRes, null, 2));

  const domainMutationRes = await query(token, `
    query {
      __type(name: "Mutation") {
        fields {
          name
        }
      }
    }
  `);
  const domainMutations = domainMutationRes.data?.__type?.fields?.filter(f => f.name.toLowerCase().includes("domain"));
  console.log("Domain mutations:", domainMutations);
}

main().catch(console.error);
