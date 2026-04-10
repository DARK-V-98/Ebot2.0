import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getMessageStats } from '@/lib/server/messageService';
import { getOrderStats } from '@/lib/server/orderService';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [msgStats, orderStats] = await Promise.all([
      getMessageStats(business.id),
      getOrderStats(business.id),
    ]);

    const activeUsersStart = new Date();
    activeUsersStart.setDate(activeUsersStart.getDate() - 7);

    const msgsSnap = await db.collection('messages')
      .where('business_id', '==', business.id)
      .get();

    const activeUsersSet = new Set();
    const dateCounts: Record<string, number> = {};
    const startTimeStr = activeUsersStart.toISOString();

    msgsSnap.docs.forEach(doc => {
      const d = doc.data();
      if (d.created_at < startTimeStr) return;
      
      activeUsersSet.add(d.customer_id);
      
      const date = d.created_at.split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const totalCustomersSnap = await db.collection('customers')
      .where('business_id', '==', business.id)
      .get();

    const chartData = Object.keys(dateCounts).sort().map(date => ({
      date,
      messages: dateCounts[date]
    }));

    return NextResponse.json({
      messages: msgStats,
      orders: orderStats,
      active_users: activeUsersSet.size,
      total_customers: totalCustomersSnap.size,
      chart: chartData,
    });
  } catch (err: any) {
    console.error('[stats]', err.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
