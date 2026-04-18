import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { processMediaMessage } from '@/lib/server/brain';

export async function POST(req: NextRequest) {
  let business = await requireAuth(req);
  
  // Local Bridge Bypass (for whatsapp-worker.js)
  if (!business) {
    const authHeader = req.headers.get('authorization');
    if (authHeader === `Bearer dev-token`) {
       business = { id: "WqxeuouFXqLPXXW4HlAd", name: "EBot Store" };
    }
  }

  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { phone, name, media } = body;

    if (!media || !media.type) {
      return NextResponse.json({ error: 'Media info is required' }, { status: 400 });
    }

    const result = await processMediaMessage({
      businessId: business.id,
      businessName: 'Aarya Bathware',
      phone: phone || 'SIMULATOR',
      contactName: name || 'Admin Simulator',
      media: media,
      whatsappMsgId: 'wa_media_' + Date.now(),
      isSimulation: true
    });

    if (!result) {
      return NextResponse.json({ error: 'AI Brain returned no response (handover mode)' }, { status: 200 });
    }

    return NextResponse.json({ 
      reply: result.reply, 
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    console.error('[simulator/media] Error:', err.message);
    return NextResponse.json({ 
      error: `Media Processing Error: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 });
  }
}
