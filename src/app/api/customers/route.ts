import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const customersSnap = await db.collection('customers')
      .where('business_id', '==', business.id)
      .orderBy('last_interaction', 'desc')
      .get();
      
    const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(customers);
  } catch (err: any) {
    if (err.message.includes('index')) {
        const fallSnap = await db.collection('customers').where('business_id', '==', business.id).get();
        const fallback = fallSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime());
        return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
