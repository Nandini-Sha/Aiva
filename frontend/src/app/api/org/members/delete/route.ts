import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await req.json();

    if (!orgId || !userId) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    const deleteMutation = `
      mutation DeleteOrgMember($orgId: uuid!, $userId: uuid!) {
        delete_org_members(where: { org_id: { _eq: $orgId }, user_id: { _eq: $userId } }) {
          affected_rows
        }
      }
    `;

    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query: deleteMutation, variables: { orgId, userId } })
    });

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json({ success: false, message: 'Deletion failed', errors: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
