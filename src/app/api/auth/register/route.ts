import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebaseAdmin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: 'name, email, password required' }, { status: 400 });

    const existingSnap = await db.collection('businesses')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get();
      
    if (!existingSnap.empty) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const apiKey = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    await db.collection('businesses').add({
      name,
      email: email.trim().toLowerCase(),
      password_hash: hash,
      api_key: apiKey,
      plan: 'free',
      is_active: 1,
      created_at: now,
      updated_at: now
    });
    
    return NextResponse.json({ message: 'Business registered. Please log in.' }, { status: 201 });
  } catch (err: any) {
    console.error('[auth/register]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
