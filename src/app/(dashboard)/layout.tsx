'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, MessageSquare, ShoppingCart,
  Package, Users, Settings, LogOut, Bot, Menu, X, ChevronRight, Activity, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/NotificationBell';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/conversations', label: 'Customer Chat', icon: MessageSquare },
  { href: '/orders', label: 'Store Sales', icon: ShoppingCart },
  { href: '/products', label: 'Inventory', icon: Package },
  { href: '/customers', label: 'Aarya Partners', icon: Users },
  { href: '/whatsapp', label: 'Bot Channel', icon: ShieldCheck },
  { href: '/settings', label: 'Control Center', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-[6px] border-blue-500/10 border-t-blue-600 rounded-2xl animate-spin mb-8 shadow-xl shadow-blue-500/10" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Aarya Systems</h2>
        <p className="text-blue-600 font-extrabold uppercase tracking-[0.2em] text-[10px]">Initializing E BOT 2.0 Intelligence Layer...</p>
      </div>
    );
  }

  // Allow developer email for now
  const isAdmin = business?.role === 'admin' || business?.email === 'tikfese@gmail.com' || business?.email === 'aarya2026@gmail.com';

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900 font-sans">
      <Toaster position="top-right" gutter={8} containerStyle={{ top: 20 }} />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[40] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-80 flex flex-col bg-slate-50 border-r border-slate-200 transition-transform duration-500 lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Brand - Aarya Hardware */}
        <div className="p-10 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 p-2">
               <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-inner">A</div>
            </div>
            <div>
              <h2 className="text-slate-900 font-black tracking-tighter text-lg leading-none uppercase">AARYA</h2>
              <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                 <ShieldCheck size={10} /> Smart Inventory
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2.5 bg-white rounded-xl shadow-sm text-slate-500 border border-slate-200 transition-transform active:scale-95">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-5 mb-5 opacity-60">Operations Console</p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                   isActive ? 'nav-link-active' : 'nav-link',
                   'group'
                )}
              >
                <div className={clsx(
                   "p-2 rounded-xl transition-colors",
                   isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200/50 text-slate-500 group-hover:bg-blue-600/10 group-hover:text-blue-600'
                )}>
                   <Icon size={18} />
                </div>
                <span className="flex-1">{label}</span>
                {isActive && (
                   <motion.div layoutId="nav-pill" className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-8 mt-6 border-t border-slate-200">
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] px-5 mb-5">Enterprise Admin</p>
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm",
                  pathname.startsWith('/admin') 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                )}
              >
                <div className={clsx(
                   "p-2 rounded-xl transition-colors",
                   pathname.startsWith('/admin') ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200/50 text-slate-500 group-hover:bg-emerald-600'
                )}>
                   <Activity size={18} />
                </div>
                <span>Dev Console</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Profile / Footer */}
        <div className="p-8 space-y-4 border-t border-slate-200">
           {/* Profile */}
           <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                 {business?.email?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black text-slate-900 truncate uppercase">{business?.email?.split('@')[0]}</p>
                 <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Store Manager</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
           </div>

           {/* Branding Badge */}
           <div className="px-4 py-3 bg-slate-900 rounded-2xl flex items-center justify-center gap-3 border border-slate-800 shadow-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black shadow-lg z-10">E</div>
              <div className="z-10">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none mb-1">Powered by</p>
                <h4 className="text-[10px] text-white font-black uppercase tracking-widest leading-none">E BOT 2.0</h4>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 px-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
             <h1 className="font-black uppercase tracking-tighter">Aarya</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 active:scale-95"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
