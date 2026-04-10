import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const ordersSnap = await db.collection('orders')
      .where('business_id', '==', business.id)
      .orderBy('created_at', 'desc')
      .get();
      
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Merge customer names
    for (let o of orders) {
       if ((o as any).customer_id) {
          const custUser = await db.collection('customers').doc((o as any).customer_id).get();
          if (custUser.exists) {
            (o as any).customer_name = custUser.data()?.profile_name || custUser.data()?.phone_number;
          }
       }
    }

    return NextResponse.json(orders);
  } catch (err: any) {
    if (err.message.includes('index')) {
       console.error('Firebase Index Required: ', err.message);
       // Fallback without sort if index is pending
       const ordersSnap = await db.collection('orders')
        .where('business_id', '==', business.id)
        .get();
       const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
       return NextResponse.json(orders);
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
