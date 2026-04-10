import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Fetch the business config to get external API details
    const bizDoc = await db.collection('businesses').doc(business.id).get();
    const config = bizDoc.data();

    if (!config?.external_inventory_url) {
      return NextResponse.json({ error: 'External API URL not configured in Settings.' }, { status: 400 });
    }

    const { 
      external_inventory_url, external_inventory_key, external_inventory_header,
      external_categories_url, external_categories_key, external_categories_header 
    } = config;

    console.log(`[sync] Syncing products for ${business.name} from ${external_inventory_url}`);

    // 2. Fetch data from the client's external API
    const productHeaders: any = {};
    if (external_inventory_key) {
      productHeaders['Authorization'] = `Bearer ${external_inventory_key}`;
      productHeaders[external_inventory_header || 'x-api-key'] = external_inventory_key;
    }

    // Auto-detect and handle common pagination limits (e.g. WooCommerce/Shopify/WP)
    let finalUrl = external_inventory_url;
    if (!finalUrl.includes('per_page=') && !finalUrl.includes('limit=')) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += `${separator}per_page=1000&limit=1000&pagesize=1000`;
    }

    const response = await axios.get(finalUrl, {
      headers: productHeaders,
      timeout: 30000 // Increased timeout for larger datasets
    });

    const responseData = response.data;
    let externalProducts = Array.isArray(responseData) ? responseData : responseData.data;

    if (!Array.isArray(externalProducts)) {
      return NextResponse.json({ 
        error: 'External API did not return an array. Make sure the endpoint returns an array or an object with a "data" property.' 
      }, { status: 422 });
    }

    // 2b. Optional Categories Fetch (Only if URL is provided)
    let externalCategories: string[] = [];
    if (external_categories_url) {
      const catHeaders: any = {};
      if (external_categories_key) {
        catHeaders['Authorization'] = `Bearer ${external_categories_key}`;
        catHeaders[external_categories_header || 'x-api-key'] = external_categories_key;
      }
      try {
        const catRes = await axios.get(external_categories_url, { headers: catHeaders, timeout: 10000 });
        const catData = catRes.data;
        const rawCats = Array.isArray(catData) ? catData : catData.data;
        if (Array.isArray(rawCats)) {
          externalCategories = rawCats.map((c: any) => typeof c === 'string' ? c : (c.name || c.title));
          console.log(`[sync] Fetched ${externalCategories.length} categories from separate endpoint.`);
        }
      } catch (catErr: any) {
        console.warn('[sync] Category sync failed (ignoring since optional):', catErr.message);
      }
    }

    const body = await req.json().catch(() => ({}));
    const shouldCommit = body.commit === true;

    // 3. Process products mapping
    const processedProducts = externalProducts.map((item: any) => {
      const name = item.name || item.title || 'Unknown Product';
      const price = parseFloat(item.discount_price || item.price || 0);
      const description = item.description || item.name_sinhala || '';
      const category = item.category_name || item.category || 'General';
      const stock = parseInt(item.quantity || item.stock || 0);
      const image_url = item.image_url || null;

      return {
        name,
        price,
        description,
        category,
        stock,
        image_url,
        business_id: business.id
      };
    });

    if (!shouldCommit) {
      return NextResponse.json({
        success: true,
        preview: true,
        products: processedProducts,
        categories: externalCategories
      });
    }

    let created = 0;
    let updated = 0;
    const now = new Date().toISOString();

    // 4. Actual Commit to Database
    for (const productData of processedProducts) {
      const existing = await db.collection('products')
        .where('business_id', '==', business.id)
        .where('name', '==', productData.name)
        .limit(1)
        .get();

      const finalData = { ...productData, is_active: 1, updated_at: now };

      if (!existing.empty) {
        await existing.docs[0].ref.update(finalData);
        updated++;
      } else {
        await db.collection('products').add({
          ...finalData,
          created_at: now
        });
        created++;
      }
    }

    // 5. Update Categorization Awareness
    if (externalCategories.length > 0) {
      await db.collection('businesses').doc(business.id).update({
        synced_categories: externalCategories,
        last_category_sync: now
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deployment complete. ${created} items successfully initialized.`,
      stats: { created, updated, categories: externalCategories.length }
    });

  } catch (err: any) {
    console.error('[sync] Sync error:', err.message);
    return NextResponse.json({ 
      error: 'Failed to sync from external API.', 
      details: err.message 
    }, { status: 500 });
  }
}
