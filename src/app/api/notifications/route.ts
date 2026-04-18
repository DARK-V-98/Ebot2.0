import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import * as notificationService from '@/lib/server/notificationService';

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');
    const result = await notificationService.getNotifications(business.id, { page, limit });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[notifications] GET error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'mark_all_read') {
      const result = await notificationService.markAllAsRead(business.id);
      return NextResponse.json(result);
    }

    if (action === 'mark_read' && notificationId) {
      await notificationService.markAsRead(notificationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[notifications] PATCH error:', err.message);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
