import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const doc = await db.collection('businesses').doc(business.id).get();
    if (!doc.exists) return NextResponse.json({}, { status: 200 });

    const data = doc.data() as any;
    return NextResponse.json({
      id: doc.id,
      name: data.name,
      email: data.email,
      plan: data.plan,
      whatsapp_phone_id: data.whatsapp_phone_id,
      whatsapp_token: data.whatsapp_token,
      external_inventory_url: data.external_inventory_url,
      external_inventory_key: data.external_inventory_key,
      external_inventory_header: data.external_inventory_header,
      external_categories_url: data.external_categories_url,
      external_categories_key: data.external_categories_key,
      external_categories_header: data.external_categories_header,
      verify_token: data.verify_token,
      created_at: data.created_at,
      api_key: data.api_key
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
