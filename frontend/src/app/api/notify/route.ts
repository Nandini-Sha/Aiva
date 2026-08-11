import { NextResponse } from 'next/server';
import { executeGraphQL } from '../../../lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Hasura Event Trigger payload
    const event = body.event;
    if (!event) return NextResponse.json({ message: 'No event' }, { status: 400 });

    const stepRun = event.data.new;
    if (!stepRun || stepRun.status !== 'completed') {
      return NextResponse.json({ message: 'Not completed' });
    }

    // Verify if this step is a notify step
    const stepData = await executeGraphQL(`
      query GetStep($id: uuid!) {
        workflow_steps_by_pk(id: $id) {
          type
          config
        }
      }
    `, { id: stepRun.step_id });

    const step = stepData.workflow_steps_by_pk;
    if (step?.type === 'notify') {
      // Simulate sending email/slack
      const to = step.config?.to || 'admin@example.com';
      const message = step.config?.message || 'Workflow step completed';
      console.log(`[NOTIFY STEP EXECUTED] Sending message to ${to}: ${message}`);
      console.log(`Payload Output:`, stepRun.output);
      
      // In a real app we'd call SendGrid or Slack API here.
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notify webhook error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
