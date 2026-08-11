import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { workflowId, name, description, steps } = await req.json();

    if (!workflowId || !name) {
      return NextResponse.json({ success: false, message: 'Missing workflowId or name' }, { status: 400 });
    }

    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    const stepObjs = Array.isArray(steps) ? steps.map((s: any, idx: number) => ({
      workflow_id: workflowId,
      type: s.type,
      config: s.config,
      order_index: idx
    })) : [];

    const updateMutation = `
      mutation UpdateWorkflow($workflowId: uuid!, $name: String!, $description: String, $objects: [workflow_steps_insert_input!]!) {
        update_workflows_by_pk(pk_columns: { id: $workflowId }, _set: { name: $name, description: $description }) {
          id
        }
        delete_workflow_steps(where: { workflow_id: { _eq: $workflowId } }) {
          affected_rows
        }
        insert_workflow_steps(objects: $objects) {
          affected_rows
        }
      }
    `;

    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ 
        query: updateMutation, 
        variables: { workflowId, name, description, objects: stepObjs } 
      })
    });

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json({ success: false, message: 'Update failed', errors: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Workflow updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
