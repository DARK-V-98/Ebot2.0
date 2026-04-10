import { db } from '../firebase/firebaseAdmin';

export async function createOrder({ businessId, customerId, productId, quantity = 1, address = null, notes = null }: any) {
  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) throw new Error('Product not found');
  const product = productDoc.data();
  if (product?.business_id !== businessId) throw new Error('Invalid product');

  const totalPrice = parseFloat(product?.price || 0) * quantity;
  const now = new Date().toISOString();

  const docRef = await db.collection('orders').add({
    business_id: businessId,
    customer_id: customerId,
    product_id: productId,
    quantity,
    total_price: totalPrice,
    status: 'pending',
    address,
    notes,
    created_at: now,
    updated_at: now
  });

  return getOrder(businessId, docRef.id);
}

export async function getOrder(businessId: string, orderId: string) {
  const doc = await db.collection('orders').doc(orderId).get();
  if (!doc.exists) return null;
  const order = doc.data() as any;
  if (order.business_id !== businessId) return null;

  const [cDoc, pDoc] = await Promise.all([
    db.collection('customers').doc(order.customer_id).get(),
    db.collection('products').doc(order.product_id).get()
  ]);

  const customer = cDoc.data() || {};
  const product = pDoc.data() || {};

  return {
    id: doc.id,
    ...order,
    customer_phone: customer.phone,
    customer_name: customer.name,
    customer_language: customer.language,
    product_name: product.name,
    product_price: product.price,
    product_image: product.image_url,
    product_category: product.category,
  };
}

export async function listOrders(businessId: string, { page = 1, limit = 20, status = '', search = '' } = {}) {
  let query: any = db.collection('orders').where('business_id', '==', businessId);
  const totalSnap = await query.get();
  const totalCount = totalSnap.size;

  if (status) {
    query = query.where('status', '==', status);
  }

  // Fetch without orderBy to avoid index requirement, sort in memory
  const snapshot = await query.get();
  
  let ordersList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

  // Sort in memory by created_at desc
  ordersList.sort((a: any, b: any) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
  
  const offset = (page - 1) * limit;
  
  const populated = await Promise.all(ordersList.map(async (o: any) => {
    const [cDoc, pDoc] = await Promise.all([
      db.collection('customers').doc(o.customer_id).get(),
      db.collection('products').doc(o.product_id).get()
    ]);
    const customer = cDoc.data() || {};
    const product = pDoc.data() || {};
    
    return {
      ...o,
      customer_phone: customer.phone,
      customer_name: customer.name,
      product_name: product.name,
      product_image: product.image_url,
      product_category: product.category,
    };
  }));

  let filtered = populated;
  if (search) {
    filtered = populated.filter((o: any) => 
      (o.customer_phone || '').includes(search) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.product_name || '').toLowerCase().includes(search.toLowerCase())
    );
  }

  return { orders: filtered.slice(offset, offset + limit), total: totalCount, page, limit };
}

export async function updateOrderStatus(businessId: string, orderId: string, status: string) {
  const doc = await db.collection('orders').doc(orderId).get();
  if (!doc.exists || doc.data()?.business_id !== businessId) throw new Error('Order not found');

  await db.collection('orders').doc(orderId).update({
    status,
    updated_at: new Date().toISOString()
  });

  return getOrder(businessId, orderId);
}

export async function getOrderStats(businessId: string) {
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const results: any = {};

  for (const s of statuses) {
    const snap = await db.collection('orders')
      .where('business_id', '==', businessId)
      .where('status', '==', s)
      .count()
      .get();
    results[s] = snap.data().count;
  }

  const totalSnap = await db.collection('orders').where('business_id', '==', businessId).count().get();
  
  const ordersSnap = await db.collection('orders').where('business_id', '==', businessId).get();
  let revenue = 0;
  ordersSnap.docs.forEach(doc => {
    const d = doc.data();
    if (d.status !== 'cancelled') {
        revenue += parseFloat(d.total_price) || 0;
    }
  });

  const todayStartStr = new Date();
  todayStartStr.setHours(0,0,0,0);
  
  const todaySnap = await db.collection('orders')
    .where('business_id', '==', businessId)
    .where('created_at', '>=', todayStartStr.toISOString())
    .get();

  return { ...results, total: totalCount, revenue, today: todaySnap.size };
}
