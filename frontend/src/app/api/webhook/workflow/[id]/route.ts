import { NextResponse } from 'next/server';
import { executeGraphQL, executeWorkflowSteps } from '../../../../../lib/engine';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: workflow_id } = params;
    const body = await request.json();
    const { session_variables } = body || {};
    const userId = session_variables?.['x-hasura-user-id'];

    // Fetch workflow and ensure it exists
    const workflowData = await executeGraphQL(
      `
        query GetWorkflow($id: uuid!, $userId: uuid) {
          workflows_by_pk(id: $id) {
            id
            org_id
            organization {
              org_members(where: {user_id: {_eq: $userId}}) { role }
            }
            steps(order_by: {order_index: asc}) { id type config }
            triggers: workflow_triggers {
              type
            }
          }
        }
      `,
      { id: workflow_id, userId }
    );

    const workflow = workflowData.workflows_by_pk;
    if (!workflow) {
      return NextResponse.json({ message: 'Workflow not found' }, { status: 404 });
    }

    // Simple validation: require a webhook trigger exists
    const hasWebhook = (workflow.triggers || []).some((t: any) => t.type === 'webhook');
    if (!hasWebhook) {
      return NextResponse.json({ message: 'Workflow does not have a webhook trigger' }, { status: 400 });
    }

    // Create a workflow run (same as manual trigger)
    const runData = await executeGraphQL(
      `
        mutation CreateRun($workflow_id: uuid!) {
          insert_workflow_runs_one(object: {workflow_id: $workflow_id, status: "running"}) { id }
        }
      `,
      { workflow_id }
    );
    const runId = runData.insert_workflow_runs_one.id;

    // Execute the workflow steps
    await executeWorkflowSteps(workflow, runId, 0, null);

    return NextResponse.json({ success: true, run_id: runId });
  } catch (error: any) {
    console.error('Webhook trigger error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
