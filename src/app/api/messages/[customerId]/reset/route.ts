import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

// POST: Reset AI (Continue AI)
export async function POST(req: NextRequest, { params }: { params: { customerId: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await db.collection('sessions').doc(params.customerId).update({
      state: 'idle',
      last_active: new Date().toISOString()
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Wipe Conversation
export async function DELETE(req: NextRequest, { params }: { params: { customerId: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const messagesSnap = await db.collection('messages')
      .where('business_id', '==', business.id)
      .where('customer_id', '==', params.customerId)
      .get();

    const batch = db.batch();
    messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
