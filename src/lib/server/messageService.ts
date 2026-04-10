import { db } from '../firebase/firebaseAdmin';

export async function saveMessage({ businessId, customerId, message, direction, intent = null, language = 'unknown', whatsappMsgId = null }: any) {
  const docRef = await db.collection('messages').add({
    business_id: businessId,
    customer_id: customerId,
    message,
    direction,
    intent,
    language,
    whatsapp_msg_id: whatsappMsgId,
    created_at: new Date().toISOString()
  });
  return docRef.id;
}

export async function getHistory(customerId: string, limit = 20) {
  const snapshot = await db.collection('messages')
    .where('customer_id', '==', customerId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
}

export async function listConversations(businessId: string, { page = 1, limit = 20, search = '' } = {}) {
  // In a real app we'd need specialized chat queries. For a unified app using Firestore:
  // Fetch all customers, then attach last message details manually.
  // Note: search acts on phone or name.

  let query = db.collection('customers').where('business_id', '==', businessId);
  const totalSnap = await query.get();
  
  // Offset pagination is limited, but doable for SaaS dashboard scales.
  const offset = (page - 1) * limit;
  let snapshot = await query.orderBy('updated_at', 'desc').offset(offset).limit(limit).get();
  
  let customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  if (search) {
    // Basic client-side filtering if search is provided
    customersData = customersData.filter((c: any) => 
      c.phone?.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const conversations = await Promise.all(customersData.map(async (c) => {
    const msgsRef = await db.collection('messages')
      .where('customer_id', '==', c.id)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();
      
    const lastMsg = msgsRef.empty ? null : msgsRef.docs[0].data();
    const countSnapshot = await db.collection('messages')
      .where('customer_id', '==', c.id)
      .get();

    return {
      customer_id: c.id,
      phone: c.phone,
      name: c.name,
      language: c.language,
      total_messages: countSnapshot.size,
      last_message_at: lastMsg?.created_at || c.created_at,
      last_message: lastMsg?.message || null,
      last_direction: lastMsg?.direction || null,
    };
  }));

  return { conversations, total: totalSnap.size, page, limit };
}

export async function getCustomerMessages(businessId: string, customerId: string, { page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const snapshot = await db.collection('messages')
    .where('business_id', '==', businessId)
    .where('customer_id', '==', customerId)
    .get();

  let messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort ascending by created_at in memory
  messages.sort((a: any, b: any) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });

  const totalSnap = await db.collection('messages')
    .where('business_id', '==', businessId)
    .where('customer_id', '==', customerId)
    .get();

  return {
    messages: messages.slice(offset, offset + limit),
    total: totalSnap.size,
    page,
    limit,
  };
}

export async function getMessageStats(businessId: string) {
  const todayStr = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD
  
  const totalSnap = await db.collection('messages').where('business_id', '==', businessId).count().get();
  const inSnap = await db.collection('messages')
    .where('business_id', '==', businessId)
    .where('direction', '==', 'in')
    .count()
    .get();
  
  // Since we don't have SQL DATE(created_at), we approximate with >= today Start
  const todayStartStr = new Date();
  todayStartStr.setHours(0,0,0,0);
  
  const todaySnap = await db.collection('messages')
    .where('business_id', '==', businessId)
    .where('created_at', '>=', todayStartStr.toISOString())
    .count()
    .get();

  return { today: todaySnap.data().count, total: totalSnap.data().count, incoming: inSnap.data().count };
}
