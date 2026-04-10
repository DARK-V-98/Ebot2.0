import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business || (business.email !== 'tikfese@gmail.com' && business.email !== 'admin@aibotbrain.com' && !business.name.toLowerCase().includes('admin'))) {
      return NextResponse.json({ error: 'Super Admin privileges required.' }, { status: 403 });
  }

  try {
    const snap = await db.collection('businesses').orderBy('created_at', 'desc').get();
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Security: sanitize password hashes
    list.forEach((b: any) => delete b.password_hash);
    
    return NextResponse.json(list);
  } catch (err: any) {
    console.error('[admin/businesses]', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
