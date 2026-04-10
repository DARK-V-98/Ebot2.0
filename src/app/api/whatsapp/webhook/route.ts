import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebaseAdmin';
import { processMessage } from '@/lib/server/brain';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe') {
    // We should ideally verify this against the database, 
    // but for the initial setup, we challenge-response.
    return new NextResponse(challenge, { status: 200 });
  }
  
  return new NextResponse('Error', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a message event
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ success: true });
    }

    const phoneId = value.metadata.phone_number_id;
    const from = message.from; // Customer phone
    const text = message.text?.body;
    const contactName = value.contacts?.[0]?.profile?.name || 'Customer';

    if (!text) return NextResponse.json({ success: true });

    // 1. Find business by phoneId
    const bizQuery = await db.collection('businesses')
      .where('whatsapp_phone_id', '==', phoneId)
      .limit(1)
      .get();

    if (bizQuery.empty) {
      console.error('[webhook] Business not found for Phone ID:', phoneId);
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessDoc = bizQuery.docs[0];
    const businessData = businessDoc.data();

    // 2. Process with AI Brain
    await processMessage({
      businessId: businessDoc.id,
      businessName: businessData.name,
      phone: from,
      contactName,
      messageText: text,
      whatsappMsgId: message.id
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
