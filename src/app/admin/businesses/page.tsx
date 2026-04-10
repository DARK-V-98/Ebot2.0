'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, Building2, Globe, Database, Copy, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

    const r = await axios.get('/api/admin/businesses', { headers: { Authorization: `Bearer ${token}` }});
    return r.data;
  };

  const verifyBusiness = async (id: string) => {
    const token = document.cookie.match(new RegExp('(^| )token=([^;]+)'))?.[2] || '';
    toast.promise(
      axios.post(`/api/admin/businesses/verify`, { id }, { headers: { Authorization: `Bearer ${token}` }}),
      {
        loading: 'Activating account...',
        success: 'Business account activated! Access granted.',
        error: 'Failed to activate. Please verify admin permissions.'
      }
    ).then(() => refetch());
  };

  const { data: businesses, isLoading, refetch } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: () => {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      return getBusinesses(match ? match[2] : '');
    }
  });

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success('System API Key Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = businesses?.filter((b: any) => 
    b.name?.toLowerCase().includes(search.toLowerCase()) || 
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-slide-up max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Tenant Management</h1>
          <p className="text-slate-500 mt-1 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
             <Building2 size={12} className="text-red-500" /> Administrative Client Registry
          </p>
        </div>
      </div>

      <div className="card p-5 bg-white border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="relative">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Brand Name or Registered Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 rounded-[20px] pl-14 pr-6 py-4 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/30 transition-all font-bold placeholder-slate-400"
          />
        </div>
      </div>

      <div className="card bg-white border-slate-200 shadow-3xl overflow-hidden rounded-[40px]">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Package Tier</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subscription</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registered</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-8 py-4"><div className="skeleton h-12 w-full rounded-2xl" /></td></tr>
                ))
              ) : filtered?.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="p-32 text-center">
                       <div className="flex flex-col items-center">
                          <Building2 size={64} className="text-slate-100 mb-6" />
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No matching tenants found in cluster</p>
                       </div>
                    </td>
                 </tr>
              ) : (
                filtered?.map((b: any) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform">
                          <Building2 size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base tracking-tight uppercase leading-none mb-2">{b.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={clsx(
                        "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border",
                        b.subscription_tier === 'enterprise' ? "bg-slate-900 text-white border-slate-800" : "bg-slate-100 text-slate-900 border-slate-200"
                      )}>
                        {b.subscription_tier || 'No Package'}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2">
                        {b.package_status === 'active' ? (
                           <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 
                             Active Account
                           </span>
                        ) : b.package_status === 'pending' ? (
                           <span className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 uppercase tracking-widest shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" /> 
                             Awaiting Verification
                           </span>
                        ) : (
                           <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-widest">
                             Unsubscribed
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-[11px] text-slate-600 font-black uppercase tracking-tighter">
                      {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex items-center justify-end gap-3">
                          {b.package_status === 'pending' && (
                             <button 
                               onClick={() => verifyBusiness(b.id)}
                               className="px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-black transition-all active:scale-95"
                             >
                               Verify Account
                             </button>
                          )}
                          <button 
                            onClick={() => copyKey(b.api_key, b.id)} 
                            className={clsx(
                              "px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95",
                              copiedId === b.id ? "bg-red-600 text-white" : "bg-white text-slate-900 border border-slate-200 hover:border-red-600 hover:text-red-600"
                            )}
                          >
                            {copiedId === b.id ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={3} />}
                            {copiedId === b.id ? 'COPIED' : 'KEY'}
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
