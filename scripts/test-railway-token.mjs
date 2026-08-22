async function main() {
  const token = "2f38e5b3-56cf-4c71-aae9-9db53f994cb9";

  console.log("Checking token with Railway GraphQL API...");
  const queries = [
    { name: "me", query: "query { me { id email name } }" },
    { name: "projects", query: "query { projects { edges { node { id name } } } }" },
    { name: "project", query: "query { project { id name } }" },
    { name: "environment", query: "query { environment { id name } }" }
  ];

  for (const q of queries) {
    try {
      const res = await fetch("https://backboard.railway.com/graphql/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: q.query })
      });
      const data = await res.json();
      console.log(`[${q.name}] Status: ${res.status}, Body:`, JSON.stringify(data));
    } catch (e) {
      console.error(`[${q.name}] Error:`, e);
    }
  }
}

main();
