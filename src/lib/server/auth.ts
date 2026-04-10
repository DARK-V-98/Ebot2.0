import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '../firebase/firebaseAdmin';

const SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_me';
const EXPIRES = '7d';

export function signToken(payload: { id: string; email: string; name: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as any;
}

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    return payload; // { id, email, name }
  } catch {
    return null;
  }
}

export async function requireApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  if (!apiKey) return null;

  const snapshot = await db.collection('businesses')
    .where('api_key', '==', apiKey)
    .where('is_active', '==', 1)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}
