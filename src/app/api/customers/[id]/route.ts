import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getCustomer } from '@/lib/server/userService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const c = await getCustomer(business.id, params.id);
    if (!c) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(c);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
