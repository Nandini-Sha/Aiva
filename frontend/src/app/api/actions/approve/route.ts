import { NextResponse } from 'next/server';
import { executeGraphQL, executeWorkflowSteps } from '../../../../lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_variables, input } = body;
    const { step_run_id } = input;
    const userId = session_variables['x-hasura-user-id'];

    // 1. Get step run details and verify org role
    const stepRunData = await executeGraphQL(`
      query GetStepRun($id: uuid!, $userId: uuid!) {
        step_runs_by_pk(id: $id) {
          status
          step_id
          input
          workflow_run {
            id
            workflow {
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
        }
      }
    `, { id: step_run_id, userId });

    const stepRun = stepRunData.step_runs_by_pk;
    if (!stepRun || stepRun.status !== 'paused') {
      return NextResponse.json({ message: 'Step run not found or not paused' }, { status: 400 });
    }

    const workflow = stepRun.workflow_run.workflow;
    const orgRole = workflow.organization.org_members[0]?.role;
    if (orgRole !== 'owner' && orgRole !== 'editor') {
      return NextResponse.json({ message: 'Permission denied: Must be owner or editor to approve' }, { status: 403 });
    }

    // 2. Mark step as completed and workflow run back to running
    await executeGraphQL(`
      mutation ApproveStep($stepId: uuid!, $runId: uuid!, $userId: uuid!) {
        update_step_runs_by_pk(pk_columns: {id: $stepId}, _set: {status: "completed", approved_by: $userId, approved_at: "now()"}) {
          id
        }
        update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "running"}) {
          id
        }
      }
    `, { stepId: step_run_id, runId: stepRun.workflow_run.id, userId });

    // 3. Figure out where we stopped
    const currentIndex = workflow.steps.findIndex((s: any) => s.id === stepRun.step_id);
    const nextIndex = currentIndex !== -1 ? currentIndex + 1 : workflow.steps.length;

    // 4. Resume execution from the NEXT step!
    if (nextIndex < workflow.steps.length) {
      // Pass the stepRun.input (which was the state of previousOutput when this step paused) 
      // or we can pass a specific approved output if the approver modified it. For now, pass input.
      await executeWorkflowSteps(workflow, stepRun.workflow_run.id, nextIndex, stepRun.input);
    } else {
      // If it was the last step, mark run complete and increment quota
      await executeGraphQL(`
        mutation ResumeRunComplete($id: uuid!, $orgId: uuid!) {
          update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: "completed"}) {
            id
          }
          update_organizations_by_pk(pk_columns: {id: $orgId}, _inc: {quota_used: 1}) {
            id
          }
        }
      `, { id: stepRun.workflow_run.id, orgId: workflow.org_id });
    }

    return NextResponse.json({ success: true, resumed: true });

  } catch (error: any) {
    console.error("Action error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

