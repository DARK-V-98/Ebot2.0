import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function PATCH(req: NextRequest) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.whatsapp_phone_id !== undefined) updateData.whatsapp_phone_id = data.whatsapp_phone_id;
    if (data.whatsapp_token !== undefined) updateData.whatsapp_token = data.whatsapp_token;
    if (data.external_inventory_url !== undefined) updateData.external_inventory_url = data.external_inventory_url;
    if (data.external_inventory_key !== undefined) updateData.external_inventory_key = data.external_inventory_key;
    if (data.external_inventory_header !== undefined) updateData.external_inventory_header = data.external_inventory_header;
    if (data.external_categories_url !== undefined) updateData.external_categories_url = data.external_categories_url;
    if (data.external_categories_key !== undefined) updateData.external_categories_key = data.external_categories_key;
    if (data.external_categories_header !== undefined) updateData.external_categories_header = data.external_categories_header;
    
    updateData.updated_at = new Date().toISOString();

    await db.collection('businesses').doc(payload.id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[settings]', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
