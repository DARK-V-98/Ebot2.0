import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase-admin';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const businessRef = db.collection('businesses').doc(id);
    const doc = await businessRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    await businessRef.update({
      package_status: 'active',
      verified_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: 'Account activated' });
  } catch (error: any) {
    console.error('Admin Verify Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
