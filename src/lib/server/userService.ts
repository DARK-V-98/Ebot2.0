import { db } from '../firebase/firebaseAdmin';

export async function findOrCreateCustomer(businessId: string, phone: string, name: string | null = null) {
  const snapshot = await db.collection('customers')
    .where('business_id', '==', businessId)
    .where('phone', '==', phone)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const now = new Date().toISOString();
  const customerRef = await db.collection('customers').add({
    business_id: businessId,
    phone,
    name,
    language: 'unknown',
    is_blocked: 0,
    created_at: now,
    updated_at: now,
  });

  const doc = await customerRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateCustomerLanguage(customerId: string, language: string) {
  await db.collection('customers').doc(customerId).update({
    language,
    updated_at: new Date().toISOString(),
  });
}

export async function updateCustomerName(customerId: string, name: string) {
  await db.collection('customers').doc(customerId).update({
    name,
    updated_at: new Date().toISOString(),
  });
}

export async function listCustomers(businessId: string, { page = 1, limit = 20 } = {}) {
  // Simple pagination logic using offset is inefficient in Firestore,
  // but for small apps we fetch all and slice, or we can use offset via .offset().
  const offset = (page - 1) * limit;

  const snapshot = await db.collection('customers')
    .where('business_id', '==', businessId)
    .orderBy('updated_at', 'desc')
    .offset(offset)
    .limit(limit)
    .get();

  const totalSnapshot = await db.collection('customers')
    .where('business_id', '==', businessId)
    .count()
    .get();

  const customersData = await Promise.all(snapshot.docs.map(async doc => {
    const data = doc.data();
    // In SQL we aggregated messages/orders. In Firestore we might need to count them per customer.
    // To save reads, we can fetch total count for each.
    const messagesCount = await db.collection('messages').where('customer_id', '==', doc.id).count().get();
    const ordersCount = await db.collection('orders').where('customer_id', '==', doc.id).count().get();

    return {
      id: doc.id,
      ...data,
      total_messages: messagesCount.data().count,
      total_orders: ordersCount.data().count,
      last_active: data.updated_at,
    };
  }));

  return { customers: customersData, total: totalSnapshot.data().count, page, limit };
}

export async function getCustomer(businessId: string, customerId: string) {
  const doc = await db.collection('customers').doc(customerId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (data?.business_id !== businessId) return null;
  return { id: doc.id, ...data };
}
