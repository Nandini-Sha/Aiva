const fetch = require('node-fetch');
const graphqlUrl = 'https://whpcwbbtppztxzpwvewp.graphql.ap-south-1.nhost.run/v1';
const adminSecret = 'Wolverine@1904';
const id = '4dd300fe-0fd4-4f4b-88fd-c03ff54f4e1a'; // From screenshot

const q = `query {
  workflows_by_pk(id: "${id}") {
    id
    name
    steps { id }
  }
}`;

fetch(graphqlUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': adminSecret
  },
  body: JSON.stringify({query: q})
})
.then(r => r.json())
.then(j => console.log(JSON.stringify(j, null, 2)))
.catch(console.error);
