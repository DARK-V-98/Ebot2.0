'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ShieldAlert, Users, Activity, Settings, LogOut, Code, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { business, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
        if (!business) router.replace('/login');
        else if (
            business.email !== 'tikfese@gmail.com' && 
            business.email !== 'admin@aibotbrain.com' && 
            !business.name.toLowerCase().includes('admin')
        ) {
             router.replace('/');
        }
    }
  }, [loading, business, router]);

  if (loading || !business) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900 font-sans">
      <aside className="w-72 flex flex-col bg-slate-50 border-r border-slate-200 shadow-[20px_0_40px_rgba(0,0,0,0.02)] relative z-10">
        <div className="p-8 border-b border-slate-200 flex items-center gap-4 bg-white">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/20">
            <ShieldAlert size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black tracking-tighter text-xl leading-none uppercase">Core</h2>
            <p className="text-[10px] text-red-600 font-black tracking-widest uppercase mt-1">Admin Node</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-8 flex flex-col gap-2 px-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Diagnostic Tools</p>
          
          <Link href="/admin" className={clsx(
            "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group",
            pathname === '/admin' ? "bg-white text-red-600 shadow-xl shadow-red-500/5 border border-red-100" : "text-slate-500 hover:text-red-600 hover:bg-white"
          )}>
            <div className="flex items-center gap-4">
              <Activity size={20} />
              <span className="text-sm font-black uppercase tracking-tight">Overview</span>
            </div>
            {pathname === '/admin' && <ChevronRight size={16} />}
          </Link>

          <Link href="/admin/businesses" className={clsx(
            "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group",
            pathname === '/admin/businesses' ? "bg-white text-red-600 shadow-xl shadow-red-500/5 border border-red-100" : "text-slate-500 hover:text-red-600 hover:bg-white"
          )}>
            <div className="flex items-center gap-4">
              <Users size={20} />
              <span className="text-sm font-black uppercase tracking-tight">Tenants</span>
            </div>
            {pathname === '/admin/businesses' && <ChevronRight size={16} />}
          </Link>

          <Link href="/admin/system" className={clsx(
            "flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group",
            pathname === '/admin/system' ? "bg-white text-red-600 shadow-xl shadow-red-500/5 border border-red-100" : "text-slate-500 hover:text-red-600 hover:bg-white"
          )}>
            <div className="flex items-center gap-4">
              <Code size={20} />
              <span className="text-sm font-black uppercase tracking-tight">Diagnostic</span>
            </div>
            {pathname === '/admin/system' && <ChevronRight size={16} />}
          </Link>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
           <button onClick={logout} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-900 text-white hover:bg-red-600 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-500/10 active:scale-95">
              <LogOut size={16} /> Terminate
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white relative p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full blur-[120px] -mr-48 -mt-48 opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto">
             {children}
          </div>
      </main>
    </div>
  );
}
