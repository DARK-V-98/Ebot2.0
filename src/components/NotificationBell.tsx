'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/firebaseClient';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Bell, X, Check, CheckCheck, MessageSquare, ShoppingCart, AlertTriangle, Camera, Users, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import api from '@/lib/api';

const ICON_MAP: Record<string, any> = {
  new_message: MessageSquare,
  new_order: ShoppingCart,
  handover_request: AlertTriangle,
  order_status_change: ShoppingCart,
  new_customer: Users,
  media_received: Camera,
  system: Settings,
};

const COLOR_MAP: Record<string, string> = {
  new_message: 'bg-blue-500',
  new_order: 'bg-emerald-500',
  handover_request: 'bg-red-500',
  order_status_change: 'bg-amber-500',
  new_customer: 'bg-purple-500',
  media_received: 'bg-pink-500',
  system: 'bg-slate-500',
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { business } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(0);

  // Real-time Firestore listener
  useEffect(() => {
    if (!business?.id) return;

    const q = query(
      collection(db, 'notifications'),
      where('business_id', '==', business.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort by created_at desc
      docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setNotifications(docs.slice(0, 50));
      const newUnread = docs.filter((n: any) => !n.is_read).length;
      
      // Play sound + vibrate for new notifications
      if (newUnread > prevCountRef.current && prevCountRef.current >= 0) {
        setHasNewAlert(true);
        setTimeout(() => setHasNewAlert(false), 3000);
        
        // Play notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {}

        // Browser notification if permission granted
        if (typeof window !== 'undefined' && Notification.permission === 'granted' && docs.length > 0) {
          const latest = docs[0];
          new Notification(latest.title, {
            body: latest.body,
            icon: '/logo.png',
            tag: latest.id,
          });
        }
      }
      
      prevCountRef.current = newUnread;
      setUnreadCount(newUnread);
    });

    return () => unsub();
  }, [business?.id]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { is_read: true });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications', { action: 'mark_all_read' });
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    if (n.link) {
      router.push(n.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "relative p-3 rounded-2xl transition-all active:scale-95 border shadow-sm",
          isOpen 
            ? "bg-blue-50 text-blue-600 border-blue-200" 
            : "bg-white text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200",
          hasNewAlert && "animate-bounce"
        )}
      >
        <Bell size={20} />
        
        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring for urgent */}
        {hasNewAlert && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-400 animate-ping opacity-75" />
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-16 w-[420px] max-h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Notifications</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <CheckCheck size={12} /> Read All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Bell size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-bold">No notifications yet</p>
                  <p className="text-slate-300 text-xs mt-1">You'll see alerts here when events occur</p>
                </div>
              ) : (
                notifications.map((n: any) => {
                  const IconComponent = ICON_MAP[n.type] || Bell;
                  const dotColor = COLOR_MAP[n.type] || 'bg-slate-400';
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      onClick={() => handleNotificationClick(n)}
                      className={clsx(
                        "p-4 border-b border-slate-50 cursor-pointer transition-all flex gap-4 items-start group hover:bg-slate-50",
                        !n.is_read && "bg-blue-50/30 border-l-4 border-l-blue-500"
                      )}
                    >
                      {/* Icon */}
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm",
                        dotColor
                      )}>
                        <IconComponent size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <p className={clsx(
                            "text-xs font-bold truncate",
                            n.is_read ? "text-slate-600" : "text-slate-900"
                          )}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight truncate">{n.body}</p>
                        
                        {/* Unread indicator */}
                        {!n.is_read && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest">New</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  Showing latest {Math.min(notifications.length, 50)} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
