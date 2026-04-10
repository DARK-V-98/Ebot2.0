import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebaseAdmin';
import { signToken } from '@/lib/server/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const snapshot = await db.collection('businesses')
      .where('email', '==', email.trim().toLowerCase())
      .where('is_active', '==', 1)
      .limit(1)
      .get();

    if (snapshot.empty) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const doc = snapshot.docs[0];
    const business = { id: doc.id, ...doc.data() as any };

    const valid = await bcrypt.compare(password, business.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ id: business.id, email: business.email, name: business.name });
    
    return NextResponse.json({
      token,
      business: { id: business.id, name: business.name, email: business.email, plan: business.plan },
    });
  } catch (err: any) {
    console.error('[auth/login]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
