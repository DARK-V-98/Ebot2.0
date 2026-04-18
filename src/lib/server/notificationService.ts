import { db } from '../firebase/firebaseAdmin';

export type NotificationType = 
  | 'new_message'
  | 'new_order' 
  | 'handover_request'
  | 'order_status_change'
  | 'new_customer'
  | 'media_received'
  | 'system';

export interface CreateNotificationParams {
  businessId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  link?: string;
  customerId?: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification in Firestore.
 * The frontend listens via onSnapshot for real-time delivery.
 */
export async function createNotification(params: CreateNotificationParams) {
  const now = new Date().toISOString();

  const docRef = await db.collection('notifications').add({
    business_id: params.businessId,
    type: params.type,
    title: params.title,
    body: params.body,
    icon: params.icon || getDefaultIcon(params.type),
    link: params.link || null,
    customer_id: params.customerId || null,
    customer_name: params.customerName || null,
    metadata: params.metadata || {},
    is_read: false,
    created_at: now,
  });

  return { id: docRef.id };
}

/**
 * Get notifications for a business (paginated, newest first)
 */
export async function getNotifications(businessId: string, { page = 1, limit = 30 } = {}) {
  const snapshot = await db.collection('notifications')
    .where('business_id', '==', businessId)
    .get();

  let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by created_at desc in memory
  notifications.sort((a: any, b: any) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  const offset = (page - 1) * limit;
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return {
    notifications: notifications.slice(offset, offset + limit),
    total: notifications.length,
    unread: unreadCount,
    page,
    limit,
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string) {
  await db.collection('notifications').doc(notificationId).update({
    is_read: true,
  });
}

/**
 * Mark ALL notifications for a business as read
 */
export async function markAllAsRead(businessId: string) {
  const snapshot = await db.collection('notifications')
    .where('business_id', '==', businessId)
    .where('is_read', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { is_read: true });
  });
  await batch.commit();

  return { marked: snapshot.size };
}

/**
 * Get unread notification count for a business
 */
export async function getUnreadCount(businessId: string) {
  const snap = await db.collection('notifications')
    .where('business_id', '==', businessId)
    .where('is_read', '==', false)
    .count()
    .get();
  
  return snap.data().count;
}

function getDefaultIcon(type: NotificationType): string {
  switch (type) {
    case 'new_message':      return '💬';
    case 'new_order':        return '🛒';
    case 'handover_request': return '🚨';
    case 'order_status_change': return '📦';
    case 'new_customer':     return '👤';
    case 'media_received':   return '📸';
    case 'system':           return '⚙️';
    default:                 return '🔔';
  }
}
