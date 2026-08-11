import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ success: false, message: 'Missing orgId' }, { status: 400 });
    }

    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    const deleteMutation = `
      mutation DeleteOrg($orgId: uuid!) {
        delete_organizations_by_pk(id: $orgId) {
          id
        }
      }
    `;

    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query: deleteMutation, variables: { orgId } })
    });

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json({ success: false, message: 'Deletion failed', errors: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
