import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getCategories } from '@/lib/server/productService';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await getCategories(business.id);
    return NextResponse.json(categories);
  } catch (err: any) {
    console.error('[categories-api]', err.message);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
