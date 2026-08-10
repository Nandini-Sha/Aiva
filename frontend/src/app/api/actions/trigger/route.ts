import { NextResponse } from 'next/server';
import { executeGraphQL, executeWorkflowSteps } from '../../../../lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_variables, input } = body;
    const { workflow_id } = input;
    const userId = session_variables['x-hasura-user-id'];

    // 1. Get workflow details and verify org role (Layer 2 gating)
    const workflowData = await executeGraphQL(`
      query GetWorkflow($id: uuid!, $userId: uuid!) {
        workflows_by_pk(id: $id) {
          org_id
          organization {
            quota_allowed
            quota_used
            org_members(where: {user_id: {_eq: $userId}}) {
              role
            }
          }
          steps(order_by: {order_index: asc}) {
            id
            type
            config
          }
        }
      }
    `, { id: workflow_id, userId });

    const workflow = workflowData.workflows_by_pk;
    if (!workflow) {
      return NextResponse.json({ message: 'Workflow not found' }, { status: 400 });
    }

    const orgRole = workflow.organization.org_members[0]?.role;
    if (orgRole !== 'owner' && orgRole !== 'editor') {
      return NextResponse.json({ message: 'Permission denied: Must be owner or editor' }, { status: 403 });
    }

    // 2. Check quota
    if (workflow.organization.quota_used >= workflow.organization.quota_allowed) {
      return NextResponse.json({ message: 'Quota exhausted' }, { status: 400 });
    }

    // 3. Create workflow_run
    const runData = await executeGraphQL(`
      mutation CreateRun($workflow_id: uuid!) {
        insert_workflow_runs_one(object: {workflow_id: $workflow_id, status: "running"}) {
          id
        }
      }
    `, { workflow_id });

    const runId = runData.insert_workflow_runs_one.id;

    // 4. Execute Steps via the shared engine (starts at index 0)
    const result = await executeWorkflowSteps(workflow, runId, 0, null);

    return NextResponse.json({ run_id: runId, status: result.status });

  } catch (error: any) {
    console.error("Action error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

