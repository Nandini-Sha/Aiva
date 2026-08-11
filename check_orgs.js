const fetch = require('node-fetch');

const HASURA_URL = "https://whpcwbbtppztxzpwvewp.graphql.ap-south-1.nhost.run/v1/graphql";
const ADMIN_SECRET = "Wolverine@1904";

async function run() {
  const query = `
    query {
      organizations {
        id
        name
        org_members {
          user_id
          role
        }
      }
    }
  `;

  const res = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET
    },
    body: JSON.stringify({ query })
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

run();
