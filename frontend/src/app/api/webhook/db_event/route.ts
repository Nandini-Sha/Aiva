import { NextResponse } from 'next/server';
import { executeGraphQL, executeWorkflowSteps } from '../../../../lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event;
    const table = body.table?.name;
    
    if (!event || !table) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const row = event.data.new;
    const orgId = row.org_id;
    if (!orgId) {
      return NextResponse.json({ message: 'No org_id in row' }, { status: 400 });
    }

    // Find workflows in this org that have a db_event trigger for this table
    const workflowsData = await executeGraphQL(`
      query GetWorkflowsForEvent($orgId: uuid!) {
        workflows(where: {
          org_id: {_eq: $orgId},
          triggers: {
            type: {_eq: "db_event"}
          }
        }) {
          id
          steps(order_by: {order_index: asc}) {
            id
            type
            config
          }
          triggers {
            type
            config
          }
          organization {
            quota_allowed
            quota_used
          }
        }
      }
    `, { orgId });

    const workflows = workflowsData.workflows || [];
    let startedCount = 0;

    for (const wf of workflows) {
      // Check if the trigger config matches the table
      const dbTrigger = wf.triggers.find((t: any) => t.type === 'db_event' && t.config?.table === table);
      if (dbTrigger) {
        // Check quota
        if (wf.organization.quota_used >= wf.organization.quota_allowed) {
          console.warn(`Quota exhausted for org ${orgId}. Cannot start workflow ${wf.id}`);
          continue;
        }

        // Start workflow
        const runData = await executeGraphQL(`
          mutation CreateRun($workflow_id: uuid!) {
            insert_workflow_runs_one(object: {workflow_id: $workflow_id, status: "running"}) {
              id
            }
          }
        `, { workflow_id: wf.id });
        
        const runId = runData.insert_workflow_runs_one.id;
        
        // Execute workflow steps, passing the row data as initial output
        // so the steps can use the newly inserted row's data
        await executeWorkflowSteps(wf, runId, 0, row);
        startedCount++;
      }
    }

    return NextResponse.json({ success: true, started_workflows: startedCount });
  } catch (err: any) {
    console.error("DB Event webhook error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
