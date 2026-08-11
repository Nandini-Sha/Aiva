import { NextResponse } from 'next/server';
import { executeGraphQL } from '../../../../lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_variables, input } = body;
    const { name, description, steps } = input;
    const userId = (() => {
      const sessionId = session_variables?.['x-hasura-user-id'];
      if (sessionId) return sessionId;
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload['sub'] ?? payload['x-hasura-user-id'] ?? null;
      } catch {
        return null;
      }
    })();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    // Verify user belongs to an organization and has role owner/editor
    const orgData = await executeGraphQL(`
      query GetUserOrg($userId: uuid!) {
        org_members(where: {user_id: {_eq: $userId}}) {
          org_id
          role
        }
      }
    `, { userId });

    const member = orgData.org_members?.[0];
    if (!member) {
      return NextResponse.json({ message: 'User not part of any organization' }, { status: 403 });
    }
    if (member.role !== 'owner' && member.role !== 'editor') {
      return NextResponse.json({ message: 'Only owners or editors can create workflows' }, { status: 403 });
    }

    // Layer 2: Gating for restricted steps
    if (member.role === 'editor' && Array.isArray(steps)) {
      const hasRestrictedStep = steps.some((s: any) => 
        s.type === 'db_write' || s.type === 'notify' || s.type === 'webhook'
      );
      if (hasRestrictedStep) {
        return NextResponse.json({ message: 'Permission denied: Only owners can add db_write, notify, or webhook steps/triggers' }, { status: 403 });
      }
    }

    // Insert workflow
    const workflowResult = await executeGraphQL(`
      mutation InsertWorkflow($name: String!, $description: String, $orgId: uuid!) {
        insert_workflows_one(object: {name: $name, description: $description, org_id: $orgId}) {
          id
        }
      }
    `, { name, description, orgId: member.org_id });

    const workflowId = workflowResult.insert_workflows_one?.id;
    if (!workflowId) {
      return NextResponse.json({ message: 'Failed to create workflow' }, { status: 500 });
    }

    // Insert steps (if any)
    if (Array.isArray(steps) && steps.length > 0) {
      const stepObjs = steps.map((s: any, idx: number) => ({
        workflow_id: workflowId,
        type: s.type,
        config: s.config,
        order_index: idx
      }));

      await executeGraphQL(`
        mutation InsertSteps($objects: [workflows_steps_insert_input!]!) {
          insert_workflows_steps(objects: $objects) {
            returning { id }
          }
        }
      `, { objects: stepObjs });
    }

    return NextResponse.json({ success: true, workflowId });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 });
  }
}
