import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { updateProduct, deleteProduct } from '@/lib/server/productService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    await updateProduct(business.id, params.id, {
      ...data,
      price: data.price ? parseFloat(data.price) : undefined,
      stock: data.stock !== undefined ? parseInt(data.stock) : undefined
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[product-update]', err.message);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deleteProduct(business.id, params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[product-delete]', err.message);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
