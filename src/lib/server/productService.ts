import { db } from '../firebase/firebaseAdmin';
import axios from 'axios';
import mysql from 'mysql2/promise';
import * as admin from 'firebase-admin';

// Simple in-memory cache for external products (5 minutes)
const externalCache = new Map<string, { data: any[], timestamp: number }>();
const extFbApps = new Map<string, admin.app.App>();
const CACHE_TTL = 5 * 60 * 1000; 

async function fetchFromExtFB(config: any) {
  if (!config.ext_fb_project_id || !config.ext_fb_client_email || !config.ext_fb_private_key) return [];
  
  try {
    const appName = `ext_${config.ext_fb_project_id}`;
    let extApp = extFbApps.get(appName);
    
    if (!extApp) {
      extApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.ext_fb_project_id,
          clientEmail: config.ext_fb_client_email,
          privateKey: config.ext_fb_private_key.replace(/\\n/g, '\n'),
        })
      }, appName);
      extFbApps.set(appName, extApp);
    }

    const extDb = extApp.firestore();
    const snapshot = await extDb.collection(config.ext_fb_collection || 'products').get();
    
    return snapshot.docs.map((doc: any) => {
      const p = doc.data();
      return {
        id: doc.id,
        name: p.name || p.title || '',
        price: p.price || 0,
        description: p.description || '',
        category: p.category || 'General',
        stock: p.stock || 0,
        image_url: p.image_url || null
      };
    });
  } catch (err: any) {
    console.error(`[productService] External Firebase Link Failed: ${err.message}`);
    return [];
  }
}

async function fetchFromSQL(config: any) {
  if (!config.db_host || !config.db_user || !config.db_name) return [];
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.db_host,
      user: config.db_user,
      password: config.db_pass,
      database: config.db_name,
      connectTimeout: 10000
    });

    const [rows]: any = await connection.execute(config.db_query || 'SELECT * FROM products');
    
    // Normalize SQL rows to standard product format
    return rows.map((p: any) => ({
      id: String(p.id || p.product_id || p.sku),
      name: p.name || p.title || p.product_name,
      price: p.price || p.unit_price || 0,
      description: p.description || p.short_description || '',
      category: p.category || p.category_name || 'General',
      stock: p.stock || p.quantity || 0,
      image_url: p.image_url || p.thumbnail || null
    }));
  } catch (err: any) {
    console.error(`[productService] SQL connection failed: ${err.message}`);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}
export async function searchProducts(businessId: string, keywords: string[] = [], limit = 5) {
  let products: any[] = [];
  
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  const config = bizDoc.data();
  const priority = config?.inventory_priority || 'hybrid';

  // 1. Try to fetch from external API if configured AND priority allowed
  if (config?.external_inventory_url && (priority === 'api' || priority === 'hybrid')) {
    try {
      const cacheKey = `${businessId}_external`;
      const cached = externalCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        products = cached.data;
      } else {
        const headers: any = {};
        if (config.external_inventory_key) {
          headers['Authorization'] = `Bearer ${config.external_inventory_key}`;
          headers[config.external_inventory_header || 'x-api-key'] = config.external_inventory_key;
        }

        const res = await axios.get(config.external_inventory_url, { headers, timeout: 20000 });
        const resData = res.data;
        let extProds = Array.isArray(resData) ? resData : (resData.data || []);
        
        products = extProds.map((p: any) => ({
          id: p.id || p.name,
          name: p.name || p.title,
          price: p.discount_price || p.price,
          description: p.description || p.short_description || '',
          category: p.category_name || p.category || 'General',
          stock: p.quantity || p.stock || 0,
          image_url: p.image_url || null
        }));

        externalCache.set(cacheKey, { data: products, timestamp: now });
      }
    } catch (err: any) {
      console.error(`[productService] External API failed: ${err.message}`);
    }
  }

  // 1.5 Try to fetch from Direct SQL if priority allowed
  if (priority === 'sql' || priority === 'hybrid') {
    const cacheKey = `${businessId}_sql`;
    const cached = externalCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      products = [...products, ...cached.data];
    } else {
      const sqlProds = await fetchFromSQL(config);
      if (sqlProds.length > 0) {
        products = [...products, ...sqlProds];
        externalCache.set(cacheKey, { data: sqlProds, timestamp: now });
      }
    }
  }

  // 1.7 Try to fetch from External Firebase if priority allowed
  if (priority === 'fb_ext' || priority === 'hybrid') {
    const cacheKey = `${businessId}_fbext`;
    const cached = externalCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      products = [...products, ...cached.data];
    } else {
      const fbProds = await fetchFromExtFB(config);
      if (fbProds.length > 0) {
        products = [...products, ...fbProds];
        externalCache.set(cacheKey, { data: fbProds, timestamp: now });
      }
    }
  }

  // 2. Fallback/Merge with local products
  if (priority === 'local' || priority === 'hybrid' || ((priority === 'api' || priority === 'sql' || priority === 'fb_ext') && products.length === 0)) {
    const query = db.collection('products')
      .where('business_id', '==', businessId)
      .where('is_active', '==', 1);

    const snapshot = await query.get();
    const localProds = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    products = [...products, ...localProds];
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
  
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  const config = bizDoc.data();
  const priority = config?.inventory_priority || 'hybrid';

  // 1. Get products from external cache if applicable
  if (priority === 'api' || priority === 'hybrid') {
    const cacheKey = `${businessId}_external`;
    let cached = externalCache.get(cacheKey);
    
    if (!cached || (Date.now() - cached.timestamp >= CACHE_TTL)) {
      await searchProducts(businessId, [], 1000);
      cached = externalCache.get(cacheKey);
    }

    if (cached && Array.isArray(cached.data)) {
      products = [...products, ...cached.data];
    }
  }

  // 1.5 Get products from SQL cache if applicable
  if (priority === 'sql' || priority === 'hybrid') {
    const cacheKey = `${businessId}_sql`;
    let cached = externalCache.get(cacheKey);
    
    if (!cached || (Date.now() - cached.timestamp >= CACHE_TTL)) {
      await searchProducts(businessId, [], 1000);
      cached = externalCache.get(cacheKey);
    }

    if (cached && Array.isArray(cached.data)) {
      products = [...products, ...cached.data];
    }
  }

  // 1.7 Get products from External FB cache if applicable
  if (priority === 'fb_ext' || priority === 'hybrid') {
    const cacheKey = `${businessId}_fbext`;
    let cached = externalCache.get(cacheKey);
    
    if (!cached || (Date.now() - cached.timestamp >= CACHE_TTL)) {
      await searchProducts(businessId, [], 1000);
      cached = externalCache.get(cacheKey);
    }

    if (cached && Array.isArray(cached.data)) {
      products = [...products, ...cached.data];
    }
  }

  // 2. Supplement with local Firestore products if applicable
  if (priority === 'local' || priority === 'hybrid') {
    const snapshot = await db.collection('products')
      .where('business_id', '==', businessId)
      .where('is_active', '==', 1)
      .get();
    
    const localProducts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    products = [...products, ...localProducts];
  }

  // 3. Apply Filters (Category & Search)
  if (category) {
    const catSearch = category.toLowerCase().trim();
    products = products.filter((p: any) => {
       const pCat = String(p.category || '').toLowerCase().trim();
       return pCat === catSearch || pCat.includes(catSearch) || catSearch.includes(pCat);
    });
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

  // 1. Check all external caches: External API, SQL, and Remote Firebase
  const cacheKeys = [`${businessId}_external`, `${businessId}_sql`, `${businessId}_fbext`];
  for (const key of cacheKeys) {
    let cached = externalCache.get(key);
    if (!cached) {
      await searchProducts(businessId, [], 100);
      cached = externalCache.get(key);
    }
    if (cached && Array.isArray(cached.data)) {
      cached.data.forEach((p: any) => {
        if (p.category) categories.add(p.category);
      });
    }
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
