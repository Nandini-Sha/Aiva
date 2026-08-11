import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, role, orgId } = await req.json();

    if (!email || !password || !role || !orgId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const NHOST_AUTH_URL = `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.auth.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1/signup/email-password`;
    
    // 1. Sign up the user using Nhost Auth API
    const authRes = await fetch(NHOST_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const authData = await authRes.json();
    
    // Wait for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Fetch the user's ID via GraphQL (since signup response might not have it if email verification is on)
    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server configuration error: Missing Hasura Admin Secret or GraphQL URL.' }, { status: 500 });
    }

    const getUserQuery = `
      query GetUser($email: citext!) {
        auth_users(where: { email: { _eq: $email } }) {
          id
        }
      }
    `;

    const userRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': adminSecret
      },
      body: JSON.stringify({
        query: getUserQuery,
        variables: { email }
      })
    });

    const userData = await userRes.json();
    const newUserId = userData.data?.auth_users?.[0]?.id;

    if (!newUserId) {
      // If user creation failed or they already exist, we should check that
      if (authData.error) {
         return NextResponse.json({ success: false, message: authData.message || authData.error }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'User created but could not retrieve ID for org mapping. They may need to verify their email first.' }, { status: 500 });
    }

    // 3. Insert the user into org_members
    const insertMemberMutation = `
      mutation InsertOrgMember($org_id: uuid!, $user_id: uuid!, $role: String!) {
        insert_org_members_one(object: {
          org_id: $org_id,
          user_id: $user_id,
          role: $role
        }) {
          id
        }
      }
    `;

    const insertRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': adminSecret
      },
      body: JSON.stringify({
        query: insertMemberMutation,
        variables: { org_id: orgId, user_id: newUserId, role }
      })
    });

    const insertData = await insertRes.json();

    if (insertData.errors) {
      // If they are already in the org, it's a unique constraint violation
      return NextResponse.json({ success: false, message: 'Failed to add user to org. They might already be a member.', errors: insertData.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User invited successfully' });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
