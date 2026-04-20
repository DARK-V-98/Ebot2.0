import { db } from '../firebase/firebaseAdmin';

/**
 * Aarya Hardware uses a 'users' collection for both admins and customers.
 * field 'role' defines if they are an admin or a customer.
 */

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  name?: string;
  phone?: string;
  createdAt?: any;
}

export async function findUserByEmail(email: string) {
  const snapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as User;
}

/**
 * For the Bot: Find or create a user by phone (mapping to their existing user base)
 */
export async function findOrCreateUserByPhone(phone: string, name: string | null = null) {
  const snapshot = await db.collection('users')
    .where('phone', '==', phone)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  // If not found, create as a 'customer' role
  const now = new Date();
  const userRef = await db.collection('users').add({
    phone,
    name,
    role: 'customer',
    createdAt: now,
    updatedAt: now,
  });

  const doc = await userRef.get();
  return { id: doc.id, ...doc.data() } as User;
}

export async function listUsers(businessId: string, { page = 1, limit = 20, role = '' } = {}) {
  let query: any = db.collection('users');

  if (role) {
    query = query.where('role', '==', role);
  }

  const offset = (page - 1) * limit;
  const snapshot = await query.get();
  
  let docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));
  
  // Sort in memory
  docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const total = docs.length;
  const paginatedDocs = docs.slice(offset, offset + limit);

  const users = await Promise.all(paginatedDocs.map(async (docData) => {
    const ordersSnap = await db.collection('orders').where('userId', '==', docData.id).count().get();

    return {
      ...docData,
      total_orders: ordersSnap.data().count,
    };
  }));

  return { users, total, page, limit };
}

export async function getCustomer(businessId: string, userId: string) {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as User;
}
