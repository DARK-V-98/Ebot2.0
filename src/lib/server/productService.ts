import { db } from '../firebase/firebaseAdmin';
import axios from 'axios';

// Simple in-memory cache for external products (5 minutes)
const externalCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; 

export async function searchProducts(businessId: string, keywords: string[] = [], limit = 5) {
  let products: any[] = [];
  
  // 1. Try to fetch from external API if configured
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();
    
    if (config?.external_inventory_url) {
      const cacheKey = `${businessId}_external`;
      const cached = externalCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        products = cached.data;
        console.log(`[productService] Using cached external products for ${businessId}`);
      } else {
        const headers: any = {};
        if (config.external_inventory_key) {
          headers['Authorization'] = `Bearer ${config.external_inventory_key}`;
          headers[config.external_inventory_header || 'x-api-key'] = config.external_inventory_key;
        }

        // Use the high-count URL logic
        let url = config.external_inventory_url;
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${url.includes('per_page') ? '' : `${separator}per_page=1000&limit=1000`}`;

        const res = await axios.get(finalUrl, { headers, timeout: 20000 });
        const resData = res.data;
        products = Array.isArray(resData) ? resData : (resData.data || []);
        
        // Normalize fields
        products = products.map((p: any) => ({
          id: p.id || p.name,
          name: p.name || p.title,
          price: p.discount_price || p.price,
          description: p.description || p.name_sinhala || p.short_description || '',
          category: p.category_name || p.category || 'General',
          stock: p.quantity || p.stock || 0,
          image_url: p.image_url || null
        }));

        externalCache.set(cacheKey, { data: products, timestamp: now });
        console.log(`[productService] Fetched ${products.length} real-time products for ${businessId}`);
      }
    }
  } catch (err: any) {
    console.error(`[productService] External search failed: ${err.message}. Checking stale cache...`);
    const cached = externalCache.get(`${businessId}_external`);
    if (cached) {
      console.log(`[productService] Using stale cache for ${businessId} as fallback.`);
      products = cached.data;
    }
  }

  // 2. Fallback to local products if external is empty or failed
  if (products.length === 0) {
    const query = db.collection('products')
      .where('business_id', '==', businessId)
      .where('is_active', '==', 1);

    const snapshot = await query.get();
    products = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  // 3. Search logic (Keyword filtering + Stock check)
  if (keywords.length) {
    products = products.filter((p: any) => {
      // Only show items with stock > 0
      if (p.stock <= 0) return false;
      
      const text = `${p.name} ${p.tags || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
      return keywords.some(k => text.includes(k.toLowerCase()));
    });
  } else {
    // Even if no keywords, filter by stock
    products = products.filter((p: any) => p.stock > 0);
  }
  
  return products.slice(0, limit);
}

export async function listProducts(businessId: string, { page = 1, limit = 1000, category = '', search = '' } = {}) {
  let products: any[] = [];

  // 1. Get products from external cache first
  const cacheKey = `${businessId}_external`;
  let cached = externalCache.get(cacheKey);
  if (cached && Array.isArray(cached.data)) {
    products = [...cached.data];
  }

  // 2. Supplement with local Firestore products
  const snapshot = await db.collection('products')
    .where('business_id', '==', businessId)
    .where('is_active', '==', 1)
    .get();
  
  const localProducts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  products = [...products, ...localProducts];

  // 3. Apply Filters (Category & Search)
  if (category) {
    const catSearch = category.toLowerCase().trim();
    products = products.filter((p: any) => String(p.category || '').toLowerCase().trim() === catSearch);
  }

  if (search) {
    const s = search.toLowerCase();
    products = products.filter((p: any) => 
      (p.name || '').toLowerCase().includes(s) || 
      (p.tags || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s)
    );
  }

  // 4. Sort in memory by created_at desc (local items) or just generally
  products.sort((a: any, b: any) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  const offset = (page - 1) * limit;
  const total = products.length;
  products = products.slice(offset, offset + limit);

  return { products, total, page, limit };
}

export async function getProduct(businessId: string, productId: string) {
  // 1. Check real-time external API cache first to get latest stock/price
  const cacheKey = `${businessId}_external`;
  let cached = externalCache.get(cacheKey);
  
  // If cache is missing or expired, fetch from external API via searchProducts
  if (!cached || (Date.now() - cached.timestamp >= CACHE_TTL)) {
    await searchProducts(businessId, [], 1000);
    cached = externalCache.get(cacheKey);
  }

  if (cached) {
    const extP = cached.data.find((p: any) => String(p.id) === String(productId) || p.name === productId);
    if (extP) return { ...extP, __source: 'external' };
  }

  // 2. Fallback to local database if not found externally
  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (data?.business_id !== businessId) return null;
  return { id: doc.id, ...data, __source: 'local' };
}

export async function createProduct(businessId: string, data: any) {
  const { name, description, price, category, tags, image_url, stock } = data;
  const now = new Date().toISOString();
  const docRef = await db.collection('products').add({
    business_id: businessId,
    name,
    description: description || null,
    price,
    category: category || null,
    tags: tags || null,
    image_url: image_url || null,
    stock: stock || 0,
    is_active: 1,
    created_at: now,
    updated_at: now
  });
  return getProduct(businessId, docRef.id);
}

export async function updateProduct(businessId: string, productId: string, data: any) {
  const p = await getProduct(businessId, productId);
  if (!p) throw new Error('Product not found');

  await db.collection('products').doc(productId).update({
    ...data,
    updated_at: new Date().toISOString()
  });
  
  return getProduct(businessId, productId);
}

export async function deleteProduct(businessId: string, productId: string) {
  const p = await getProduct(businessId, productId);
  if (!p) throw new Error('Product not found');
  
  await db.collection('products').doc(productId).update({ is_active: 0 });
  return { success: true };
}

export async function getCategories(businessId: string) {
  const categories = new Set<string>();

  // 1. Check external cache first (as it likely contains the most recent/relevant items)
  let cached = externalCache.get(`${businessId}_external`);
  if (!cached) {
    // Attempt to trigger a search to populate the cache if it's empty
    await searchProducts(businessId, [], 100);
    cached = externalCache.get(`${businessId}_external`);
  }

  if (cached && Array.isArray(cached.data)) {
    cached.data.forEach((p: any) => {
      if (p.category) categories.add(p.category);
    });
  }

  // 2. Get categories from local Firestore products
  const snapshot = await db.collection('products')
    .where('business_id', '==', businessId)
    .where('is_active', '==', 1)
    .get();
    
  snapshot.docs.forEach((doc) => {
    const c = doc.data().category;
    if (c) categories.add(c);
  });

  // 3. Get master categories from business config
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  const syncedCats = bizDoc.data()?.synced_categories;
  if (Array.isArray(syncedCats)) {
    syncedCats.forEach(c => categories.add(c));
  }
  
  return Array.from(categories).sort();
}
