import { db } from '../firebase/firebaseAdmin';

export interface Product {
  id: string;
  name: string;
  name_si?: string;
  description?: string;
  description_si?: string;
  price: number;
  discountPrice?: number;
  image_url: string;
  additionalImageUrls?: string[];
  category: string;
  categoryId?: string;
  stock: number;
  featured: boolean;
  createdAt: any;
  is_active?: number;
}

/**
 * Maps raw Firestore data to the unified Product interface
 */
function mapProduct(doc: any, categoryMap: Record<string, string>): Product {
    const data = doc.data();
    const catId = data.category || data.categoryId || '';
    return {
        id: doc.id,
        ...data,
        name: data.name || 'Unnamed Product',
        price: Number(data.price || 0),
        image_url: data.image_url || data.imageUrl || '',
        categoryId: catId,
        category: categoryMap[catId] || catId || 'Uncategorized',
        stock: data.stock !== undefined ? data.stock : (data.quantity !== undefined ? data.quantity : 0),
        featured: !!data.featured,
        createdAt: data.createdAt || data.created_at || null
    } as Product;
}

/**
 * Internal helper to get a map of category ID -> Name
 */
async function getCategoryMap(): Promise<Record<string, string>> {
    const snapshot = await db.collection('categories').get();
    const map: Record<string, string> = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        map[doc.id] = data.name || data.title || doc.id;
    });
    return map;
}

/**
 * Filter and Search Products from Local Firebase Only
 */
export async function searchProducts(businessId: string, keywords: string[] = [], limit = 10) {
  try {
    const catMap = await getCategoryMap();
    const snapshot = await db.collection('products').limit(500).get();
    let products = snapshot.docs.map(doc => mapProduct(doc, catMap));

    if (keywords.length) {
        products = products.filter((p: Product) => {
        const text = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
        return keywords.some(k => text.includes(k.toLowerCase()));
        });
    }

    return products.slice(0, limit);
  } catch (err: any) {
    console.error('[product-service] search error:', err.message);
    return [];
  }
}

/**
 * List products with pagination and filters
 */
export async function listProducts(businessId: string, { page = 1, limit = 500, category = '', search = '' } = {}) {
  try {
    console.log(`[product-service] Listing products (Max ${limit})...`);
    
    // 1. Get Category Map for resolving IDs to Names
    const catMap = await getCategoryMap();

    // 2. Fetch all products (limit high for now to show all 300+)
    const snapshot = await db.collection('products').limit(1000).get();
    console.log(`[product-service] Found ${snapshot.size} total docs`);
    
    let products = snapshot.docs.map(doc => mapProduct(doc, catMap));

    // 3. Filter by Category (match Name or ID)
    if (category) {
      products = products.filter((p: Product) => 
        p.category === category || p.categoryId === category
      );
    }

    // 4. Filter by Search
    if (search) {
      const s = search.toLowerCase();
      products = products.filter((p: Product) => 
        (p.name || '').toLowerCase().includes(s) || 
        (p.description || '').toLowerCase().includes(s) ||
        (p.category || '').toLowerCase().includes(s)
      );
    }

    // 5. Sort logic
    const getTime = (val: any) => {
      if (!val) return 0;
      try {
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (typeof val === 'string') return new Date(val).getTime();
        if (val.seconds) return val.seconds * 1000;
      } catch (e) { return 0; }
      return 0;
    };

    console.log('[product-service] Sorting...');
    products.sort((a: any, b: any) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return getTime(b.createdAt) - getTime(a.createdAt);
    });

    console.log('[product-service] Finalizing results...');
    const total = products.length;
    const offset = (page - 1) * limit;
    const paginated = products.slice(offset, offset + limit);

    return { products: paginated, total, page, limit };
  } catch (err: any) {
    console.error('[product-service] CRITICAL ERROR IN listProducts:', err.message);
    return { products: [], total: 0, page, limit };
  }
}

export async function getProduct(businessId: string, productId: string) {
  const catMap = await getCategoryMap();
  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) return null;
  return mapProduct(doc, catMap);
}

export async function createProduct(businessId: string, data: any) {
  const now = new Date();
  const docRef = await db.collection('products').add({
    ...data,
    createdAt: now,
    featured: data.featured || false
  });
  return getProduct(businessId, docRef.id);
}

export async function updateProduct(businessId: string, productId: string, data: any) {
  await db.collection('products').doc(productId).update({
    ...data,
    updatedAt: new Date()
  });
  return getProduct(businessId, productId);
}

export async function deleteProduct(businessId: string, productId: string) {
  await db.collection('products').doc(productId).delete();
  return { success: true };
}

export async function getCategories(businessId: string) {
  try {
    console.log(`[product-service] Fetching categories...`);
    const catSnapshot = await db.collection('categories').get();
    const categories = catSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.name || data.title || doc.id;
    });

    return categories.sort();
  } catch (err: any) {
    console.error('[product-service] CRITICAL ERROR IN getCategories:', err.message);
    return [];
  }
}
