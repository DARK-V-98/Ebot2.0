import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business || (business.email !== 'tikfese@gmail.com' && business.email !== 'admin@aibotbrain.com' && !business.name.toLowerCase().includes('admin'))) {
      return NextResponse.json({ error: 'Super Admin privileges required.' }, { status: 403 });
  }

  try {
    const [businessesSnap, customersSnap, messagesSnap] = await Promise.all([
      db.collection('businesses').get(),
      db.collection('customers').get(),
      db.collection('messages').get(),
    ]);
    
    // Aggregate platform revenue across all orders (for large scale apps use a separate daily aggregation job)
    const ordersSnap = await db.collection('orders').get(); // Simplified for MVP
    let totalRevenue = 0;
    ordersSnap.docs.forEach(d => {
       const o = d.data();
       if (o.status !== 'cancelled') totalRevenue += parseFloat(o.total_price || 0);
    });

    return NextResponse.json({
       total_businesses: businessesSnap.size,
       total_customers: customersSnap.size,
       total_messages: messagesSnap.size,
       total_revenue: totalRevenue
    });
  } catch (err: any) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Failed to fetch global stats' }, { status: 500 });
  }
}
