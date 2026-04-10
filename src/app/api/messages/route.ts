import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Get all customers for this business to group messages
    const customersSnap = await db.collection('customers')
      .where('business_id', '==', business.id)
      .get();
      
    const conversations = [];

    // 2. Fetch messages for each customer (limit 50 recent)
    for (const doc of customersSnap.docs) {
      const c = doc.data();
      const msgsSnap = await db.collection('messages')
        .where('business_id', '==', business.id)
        .where('customer_id', '==', doc.id)
        // .orderBy('created_at', 'asc') // Omit orderby to prevent index requirement if not ready
        .get();
        
      const messages = msgsSnap.docs.map(m => {
        const d = m.data();
        return { 
          id: m.id, 
          ...d, 
          content: d.message // Match frontend expectation
        };
      }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (messages.length > 0) {
        conversations.push({
          customer_id: doc.id,
          customer_name: c.name, // Correct field
          customer_phone: c.phone, // Correct field
          is_handover: messages.some((m: any) => m.intent === 'handover'),
          messages: messages
        });
      }
    }

    // Sort conversations by latest message time
    conversations.sort((a, b) => {
      const aLast = new Date((a.messages[a.messages.length - 1] as any).created_at).getTime();
      const bLast = new Date((b.messages[b.messages.length - 1] as any).created_at).getTime();
      return bLast - aLast;
    });

    return NextResponse.json(conversations);
  } catch (err: any) {
    console.error('[messages]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
