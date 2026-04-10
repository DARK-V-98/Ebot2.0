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

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/conversations', label: 'Messages', icon: MessageSquare },
  { href: '/orders', label: 'Sales', icon: ShoppingCart },
  { href: '/products', label: 'Inventory', icon: Package },
  { href: '/customers', label: 'Partners', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6" />
        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs text-center">Loading your dashboard...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
           <img src="/logo.png" alt="logo" className="w-12 h-12 object-contain" />
        </div>
        <h2 className="text-slate-900 font-black text-3xl mb-3 tracking-tighter">Identity Required</h2>
        <p className="text-slate-500 text-sm max-w-xs mb-10 font-medium">Please authenticate through the main portal to access the systems.</p>
        <Link href="/login" className="btn-primary py-4 px-12 rounded-2xl shadow-xl shadow-blue-500/20">Return to Portal</Link>
      </div>
    );
  }

  const isDev = business?.email === 'tikfese@gmail.com';
  const isAdmin = isDev || business?.email?.includes('admin');

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
        {/* Brand */}
        <div className="p-10 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 p-2">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-slate-900 font-black tracking-tighter text-xl leading-none uppercase">eBot</h2>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                 <ShieldCheck size={10} /> Secure Account
              </p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2.5 bg-white rounded-xl shadow-sm text-slate-500 border border-slate-200 transition-transform active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-5 mb-5 opacity-60">Admin Menu</p>
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
              <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.2em] px-5 mb-5">Admin Matrix</p>
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm",
                  pathname.startsWith('/admin') 
                    ? "bg-red-50 text-red-600" 
                    : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                )}
              >
                <div className={clsx(
                   "p-2 rounded-xl transition-colors",
                   pathname.startsWith('/admin') ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200/50 text-slate-500 group-hover:bg-red-600'
                )}>
                   <Activity size={18} />
                </div>
                <span>Dev Console</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-8 border-t border-slate-200">
           <button 
             onClick={logout}
             className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-slate-500 font-bold hover:bg-slate-100 hover:text-red-600 transition-all duration-300 group"
           >
              <div className="p-2 bg-slate-200/50 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                 <LogOut size={18} />
              </div>
              <span>Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 px-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
             <h1 className="font-black uppercase tracking-tighter">eBot</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 active:scale-95"
          >
            <Menu size={22} />
          </button>
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
