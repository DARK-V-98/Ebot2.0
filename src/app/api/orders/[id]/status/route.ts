import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { status } = await req.json();
    const orderRef = db.collection('orders').doc(params.id);
    
    // Security verification that order belongs to this business
    const doc = await orderRef.get();
    if (!doc.exists || doc.data()?.business_id !== business.id) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await orderRef.update({
      status,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
