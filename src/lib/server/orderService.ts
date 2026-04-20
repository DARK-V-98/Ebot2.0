import { db } from '../firebase/firebaseAdmin';

export interface Order {
  id: string;
  userId: string;
  status: 'Pending Payment' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';
  totalAmount: number;
  paymentMethod: 'Bank Transfer' | 'Cash on Delivery';
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  createdAt: any;
  updatedAt?: any;
}

export async function createOrder(data: Partial<Order>) {
  const now = new Date();
  const docRef = await db.collection('orders').add({
    ...data,
    status: data.status || 'Pending Payment',
    createdAt: now,
    updatedAt: now
  });

  return getOrder('', docRef.id);
}

export async function getOrder(businessId: string, orderId: string) {
  const doc = await db.collection('orders').doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Order;
}

export async function listOrders(businessId: string, { page = 1, limit = 20, status = '', search = '' } = {}) {
  let query: any = db.collection('orders');

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  let ordersList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Order[];

  // Sort desc by createdAt
  ordersList.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
    const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
    return timeB - timeA;
  });

  if (search) {
    const s = search.toLowerCase();
    ordersList = ordersList.filter((o: Order) => 
      (o.shippingAddress?.name || '').toLowerCase().includes(s) ||
      (o.shippingAddress?.phone || '').includes(s) ||
      (o.items?.some(item => item.name.toLowerCase().includes(s)))
    );
  }

  const total = ordersList.length;
  const offset = (page - 1) * limit;
  return { orders: ordersList.slice(offset, offset + limit), total, page, limit };
}

export async function updateOrderStatus(businessId: string, orderId: string, status: string) {
  await db.collection('orders').doc(orderId).update({
    status,
    updatedAt: new Date()
  });

  return getOrder(businessId, orderId);
}

export async function getOrderStats(businessId: string) {
  const snapshot = await db.collection('orders').get();
  const orders = snapshot.docs.map((doc: any) => doc.data() as Order);

  const stats = {
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
    total: orders.length,
    revenue: 0,
    today: 0
  };

  const todayStr = new Date().toDateString();

  orders.forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (status.includes('pending')) stats.pending++;
    else if (status.includes('processing')) stats.processing++;
    else if (status.includes('shipped')) stats.shipped++;
    else if (status.includes('completed')) stats.completed++;
    else if (status.includes('cancelled')) stats.cancelled++;

    if (status !== 'cancelled') {
        stats.revenue += o.totalAmount || 0;
    }

    if (o.createdAt?.toDate?.()?.toDateString() === todayStr) {
        stats.today++;
    }
  });

  return stats;
}
