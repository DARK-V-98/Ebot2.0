'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Database, TrendingUp, Users, Zap, ShieldAlert, Cpu, Activity, Server, ArrowUpRight, Globe, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import clsx from 'clsx';

const getSystemStats = async (token: string) => {
  const r = await axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }});
  return r.data;
};

export default function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: () => {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      return getSystemStats(match ? match[2] : '');
    },
    refetchInterval: 15000
  });

  const chartData = [
    { name: 'Mon', usage: 400 },
    { name: 'Tue', usage: 300 },
    { name: 'Wed', usage: 600 },
    { name: 'Thu', usage: 800 },
    { name: 'Fri', usage: 500 },
    { name: 'Sat', usage: 900 },
    { name: 'Sun', usage: 1100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 animate-fade-in pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-5">
            <div className="p-4 bg-red-600 rounded-[28px] shadow-2xl shadow-red-500/30">
               <Cpu size={36} className="text-white" />
            </div>
            SYSTEM <span className="text-red-600 underline decoration-red-100 underline-offset-8">HYPERCORE</span>
          </h1>
          <p className="text-slate-500 mt-4 font-black uppercase tracking-[0.2em] flex items-center gap-3 text-xs">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Platform Governance v4.0.1
          </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Global Cluster Load</p>
              <div className="flex items-center gap-4">
                 <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-red-600 shadow-[0_0_10px_#dc2626]" />
                 </div>
                 <span className="text-sm font-black text-slate-900">42.8%</span>
              </div>
           </div>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-40 rounded-[32px] bg-slate-50" />)}
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: 'Active Tenants', value: data?.total_businesses || 0, icon: Globe, color: 'red' },
             { label: 'Global Identities', value: data?.total_customers || 0, icon: Users, color: 'slate' },
             { label: 'AI Throughput', value: data?.total_messages || 0, icon: Zap, color: 'red' },
             { label: 'System Revenue', value: `Rs. ${(data?.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'slate' },
           ].map((kpi, idx) => (
             <motion.div
               key={kpi.label}
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: idx * 0.1 }}
               className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 relative overflow-hidden group hover:border-red-600/30 transition-all active:scale-95"
             >
               <div className="absolute -right-6 -bottom-6 text-slate-100 group-hover:text-red-50 group-hover:scale-125 transition-all duration-700">
                  <kpi.icon size={140} strokeWidth={1} />
               </div>
               <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10", 
                  kpi.color === 'red' ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-slate-900 text-white shadow-slate-900/10'
               )}>
                 <kpi.icon size={28} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] text-slate-400 font-black mb-1.5 uppercase tracking-widest relative z-10">{kpi.label}</p>
               <p className="text-3xl font-black text-slate-900 relative z-10 tracking-tighter uppercase">{kpi.value}</p>
             </motion.div>
           ))}
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[40px] p-10 shadow-2xl shadow-slate-200/50">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Platform Activity</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Cross-Tenant Metric Analysis</p>
              </div>
              <div className="flex gap-3">
                 <div className="flex items-center gap-2.5 bg-red-50 px-5 py-2.5 rounded-full border border-red-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Global Sync Active</span>
                 </div>
              </div>
           </div>
           
           <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} 
                       dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                       itemStyle={{ color: '#dc2626', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="usage" stroke="#dc2626" strokeWidth={5} fill="url(#adminGrad)" dot={{ r: 8, fill: '#dc2626', strokeWidth: 4, stroke: '#FFFFFF' }} activeDot={{ r: 10 }} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-3xl flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-[80px] -mr-16 -mt-16 opacity-30" />
           <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2 relative z-10">Diagnostic Matrix</h2>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 relative z-10">Real-time Node Status</p>
           
           <div className="space-y-4 flex-1 relative z-10">
              {[
                { label: 'Auth Gateway', status: 'Healthy', ping: '12ms' },
                { label: 'AI Engine Node', status: 'Healthy', ping: '48ms' },
                { label: 'Webhook Listener', status: 'Healthy', ping: '5ms' },
                { label: 'Data Registry', status: 'Healthy', ping: '22ms' },
              ].map((node) => (
                <div key={node.label} className="p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl group/node hover:border-red-500/50 hover:bg-white/[0.05] transition-all cursor-crosshair">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-black text-slate-300 group-hover/node:text-white transition-colors uppercase tracking-tight">{node.label}</p>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase border border-emerald-500/20">{node.status}</span>
                   </div>
                   <div className="flex items-center justify-between text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                      <span>PING LATENCY</span>
                      <span className="text-red-500 group-hover/node:text-red-400 transition-colors">{node.ping}</span>
                   </div>
                </div>
              ))}
           </div>
           
           <Link href="/admin/system" className="mt-10 group flex items-center justify-between p-5 bg-red-600 rounded-3xl text-white shadow-2xl shadow-red-500/30 hover:bg-white hover:text-red-600 transition-all font-black text-xs uppercase tracking-[0.2em] relative z-10">
              Root System Control <ArrowUpRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
           </Link>
        </div>
      </div>
    </motion.div>
  );
}
