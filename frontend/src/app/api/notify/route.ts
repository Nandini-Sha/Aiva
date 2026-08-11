import { NextResponse } from 'next/server';

// Simple notification handler – in a real app you'd integrate with Slack or an email service.
// For the demo we just log the payload and return success.

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('🔔 Notify Event Trigger payload:', payload);
    // TODO: integrate with Slack/email APIs here.
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notify handler error:', err);
    return NextResponse.json({ message: 'Failed to process notification' }, { status: 500 });
  }
}
