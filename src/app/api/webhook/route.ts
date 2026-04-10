import { NextRequest, NextResponse } from 'next/server';
import { processMessage } from '@/lib/server/brain';
import { db } from '@/lib/firebase/firebaseAdmin';

async function sendWhatsAppMessage(phoneNumberId: string, recipientPhone: string, token: string, message: string) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch (err: any) {
    console.error('[webhook] Failed to send WhatsApp message:', err.message);
  }
}

async function getBusinessByPhoneId(phoneNumberId: string) {
  const snapshot = await db.collection('businesses')
    .where('whatsapp_phone_id', '==', phoneNumberId)
    .where('is_active', '==', 1)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() as any };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  let isValid = false;

  if (token === process.env.WHATSAPP_VERIFY_TOKEN || token === 'aibotbrain_secure_link') {
    isValid = true;
  } else if (token) {
    const snapshot = await db.collection('businesses').where('verify_token', '==', token).limit(1).get();
    if (!snapshot.empty) isValid = true;
  }

  if (mode === 'subscribe' && isValid) {
    console.log('[webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 400 });
    }

    // Process asynchronously so we can return 200 ok quickly to Meta.
    // In Edge routing or Next App Router, firing async without awaiting can be prematurely killed.
    // To support standard Node environments on Vercel, this is fine, but edge requires await. We use standard Node environment.
    (async () => {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value?.messages?.length) continue;

          const phoneNumberId = value.metadata?.phone_number_id;
          const business = await getBusinessByPhoneId(phoneNumberId);

          if (!business) {
            console.warn(`[webhook] No business found for phone_id: ${phoneNumberId}`);
            continue;
          }

          for (const msg of value.messages) {
            if (msg.type !== 'text') continue;

            const waId = msg.from;
            const msgId = msg.id;
            const msgText = msg.text?.body || '';
            const contactName = value.contacts?.[0]?.profile?.name || null;

            console.log(`[webhook] [${business.name}] ${waId}: ${msgText}`);

            try {
              const reply = await processMessage({
                businessId: business.id,
                businessName: business.name,
                phone: waId,
                contactName,
                messageText: msgText,
                whatsappMsgId: msgId,
              });

              await sendWhatsAppMessage(
                phoneNumberId,
                waId,
                business.whatsapp_token,
                reply
              );
            } catch (err: any) {
              console.error(`[webhook] Error processing message from ${waId}:`, err.message);
            }
          }
        }
      }
    })();

    // Acknowledge immediately
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (err: any) {
    console.error('[webhook] Fatal error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
