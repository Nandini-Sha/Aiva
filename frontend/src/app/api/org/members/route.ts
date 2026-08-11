import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get('orgId');
    if (!orgId) return NextResponse.json({ success: false, message: 'Missing orgId' }, { status: 400 });

    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    // 1. Fetch org_members
    const membersQuery = `
      query GetOrgMembers($orgId: uuid!) {
        org_members(where: { org_id: { _eq: $orgId } }) {
          user_id
          role
          created_at
        }
      }
    `;

    const membersRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query: membersQuery, variables: { orgId } })
    });
    const membersData = await membersRes.json();
    const members = membersData.data?.org_members || [];

    if (members.length === 0) {
      return NextResponse.json({ success: true, members: [] });
    }

    const userIds = members.map((m: any) => m.user_id);

    // 2. Fetch auth_users
    const usersQuery = `
      query GetAuthUsers($userIds: [uuid!]!) {
        auth_users(where: { id: { _in: $userIds } }) {
          id
          email
        }
      }
    `;

    const usersRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query: usersQuery, variables: { userIds } })
    });
    
    const usersData = await usersRes.json();
    const users = usersData.data?.auth_users || [];

    // 3. Merge
    const merged = members.map((m: any) => {
      const user = users.find((u: any) => u.id === m.user_id);
      return {
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        email: user?.email || 'Unknown User'
      };
    });

    return NextResponse.json({ success: true, members: merged });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
