import { NextResponse } from 'next/server';
import { executeGraphQL } from '../../../../lib/engine';

export async function POST(request: Request) {
  try {
    const { userId, orgName } = await request.json();

    if (!userId || !orgName) {
      return NextResponse.json({ message: 'userId and orgName are required' }, { status: 400 });
    }

    // Check if user already has an org
    const existing = await executeGraphQL(`
      query CheckOrg($userId: uuid!) {
        org_members(where: {user_id: {_eq: $userId}}) { org_id }
      }
    `, { userId });

    if (existing.org_members?.length > 0) {
      return NextResponse.json({ success: true, alreadyExists: true });
    }

    // Create organization and add user as owner
    const result = await executeGraphQL(`
      mutation CreateOrg($name: String!, $userId: uuid!) {
        insert_organizations_one(object: {
          name: $name,
          org_members: {
            data: [{ user_id: $userId, role: "owner" }]
          }
        }) {
          id
          name
        }
      }
    `, { name: orgName, userId });

    const org = result.insert_organizations_one;
    if (!org) {
      return NextResponse.json({ message: 'Failed to create organization' }, { status: 500 });
    }

    return NextResponse.json({ success: true, org });
  } catch (error: any) {
    console.error('Create org error:', error);
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
  }
}
