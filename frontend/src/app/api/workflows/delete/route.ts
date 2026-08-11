import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { workflowId } = await req.json();

    if (!workflowId) {
      return NextResponse.json({ success: false, message: 'Missing workflowId' }, { status: 400 });
    }

    const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
    const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

    if (!graphqlUrl || !adminSecret) {
      return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500 });
    }

    const deleteMutation = `
      mutation DeleteWorkflow($workflowId: uuid!) {
        delete_workflows_by_pk(id: $workflowId) {
          id
        }
      }
    `;

    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': adminSecret },
      body: JSON.stringify({ query: deleteMutation, variables: { workflowId } })
    });

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json({ success: false, message: 'Deletion failed', errors: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
