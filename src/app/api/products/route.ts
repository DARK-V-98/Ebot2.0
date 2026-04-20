import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getProduct, createProduct, listProducts } from '@/lib/server/productService';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const category = req.nextUrl.searchParams.get('category') || '';
    
    console.log(`[products-api] Fetching products for business ${business.id}, search: "${search}", category: "${category}"`);
    
    // Using listProducts which is defined in the service
    const result = await listProducts(business.id, { search, category });
    
    if (!result || !result.products) {
       console.error('[products-api] Invalid result from listProducts:', result);
       return NextResponse.json({ error: 'Invalid response from service' }, { status: 500 });
    }

    return NextResponse.json(result.products);
  } catch (err: any) {
    console.error('[products-api] CRITICAL ERROR:', err.message, err.stack);
    return NextResponse.json({ error: 'Failed to fetch products', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    if (!data.name || !data.price) {
      return NextResponse.json({ error: 'Name and price required' }, { status: 400 });
    }
    
    const id = await createProduct(business.id, {
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      category: data.category || '',
      stock: parseInt(data.stock) || 0,
      image_url: data.image_url || '',
    });
    
    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
