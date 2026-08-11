const fetch = require('node-fetch');
const id = '4dd300fe-0fd4-4f4b-88fd-c03ff54f4e1a'; // From screenshot
const q = `query {
  workflows_by_pk(id: "${id}") {
    id
    name
    steps { id }
  }
}`;
fetch('http://localhost:3000/api/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: q})
})
.then(r => r.json())
.then(j => console.log(JSON.stringify(j, null, 2)))
.catch(console.error);
