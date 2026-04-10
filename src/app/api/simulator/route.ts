import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { processMessage } from '@/lib/server/brain';

export async function POST(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const reply = await processMessage({
      businessId: business.id,
      businessName: business.name || 'Your Business',
      phone: 'SIMULATOR',
      contactName: 'Admin Simulator',
      messageText: message,
      whatsappMsgId: 'sim_' + Date.now(),
      isSimulation: true
    });

    return NextResponse.json({ reply, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[simulator] Error:', err.message);
    return NextResponse.json({ 
      error: `Simulation Error: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 });
  }
}
