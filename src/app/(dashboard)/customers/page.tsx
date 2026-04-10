'use client';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/api';
import { Search, UserCircle2, ExternalLink, Hash, Clock } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers(),
  });

  const filtered = customers?.filter((c: any) => 
    c.phone_number?.includes(search) || 
    c.profile_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Customer Directory</h1>
          <p className="text-slate-500 text-sm mt-1 font-bold">Comprehensive list of all AI-engaged identities.</p>
        </div>
      </div>

      <div className="card p-5 bg-white border-slate-200 shadow-sm">
        <div className="relative max-w-xl">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Profile Name or Phone Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium"
          />
        </div>
      </div>

      <div className="card overflow-hidden bg-white border-slate-200 shadow-xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Connection</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined On</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Analysis</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-6 py-6" colSpan={5}><div className="skeleton h-8 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                       <UserCircle2 size={48} className="text-slate-200 mb-4" />
                       <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No customer records in memory</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-all group border-b border-slate-50">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105">
                          <UserCircle2 size={28} strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none mb-1.5">{c.profile_name || 'Anonymous User'}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                             <Hash size={10} /> {c.id.slice(0, 12)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className="px-3 py-1 bg-slate-100 text-slate-900 font-black text-[11px] rounded-lg tracking-widest border border-slate-200">
                         +{c.phone_number}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-xs text-slate-600 font-black uppercase tracking-tighter">
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2 text-xs text-slate-900 font-black uppercase">
                          <Clock size={12} className="text-blue-600" />
                          {new Date(c.last_interaction).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Link href={`/conversations?phone=${c.phone_number}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 group/btn">
                         System Logs <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
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
