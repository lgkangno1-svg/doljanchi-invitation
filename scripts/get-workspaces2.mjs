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
  const meRes = await query(token, `
    query {
      me {
        id
        email
        workspaces {
          id
          name
        }
      }
    }
  `);
  console.log("Workspaces:", JSON.stringify(meRes, null, 2));
}

main().catch(console.error);
