'use client';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, ShoppingCart, Users, TrendingUp,
  ArrowUpRight, Clock, CheckCircle2, Package, Zap, Bot, Activity, Box
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardStats, getDashboardInsights } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

function StatCard({ title, value, sub, icon: Icon, color, href }: any) {
  const colorMap: any = {
    green:  { bg: 'bg-emerald-50',  icon: 'text-emerald-600',  ring: 'ring-emerald-500/20' },
    blue:   { bg: 'bg-blue-50',     icon: 'text-blue-600',     ring: 'ring-blue-500/20'    },
    orange: { bg: 'bg-orange-50',   icon: 'text-orange-600',   ring: 'ring-orange-500/20'  },
    purple: { bg: 'bg-purple-50',   icon: 'text-purple-600',   ring: 'ring-purple-500/20'  },
  };
  const c = colorMap[color] || colorMap.blue;

  const inner = (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer h-full transition-all"
    >
      <div className="flex items-start justify-between">
        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center`}>
          <Icon size={24} className={c.icon} />
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="mt-6">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-1.5 capitaize">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {sub}
        </p>}
      </div>
    </motion.div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { business } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: getDashboardInsights,
    refetchInterval: 60_000,
  });

  const chartData = data?.chart?.map((d: any) => ({
    date: format(parseISO(d.date), 'MMM d'),
    messages: parseInt(d.messages),
  })) ?? [];

  const pieData = data && data.orders
    ? [
        { name: 'Pending',   value: data.orders.pending   },
        { name: 'Processing', value: data.orders.processing },
        { name: 'Shipped',   value: data.orders.shipped   },
        { name: 'Completed', value: data.orders.completed },
      ].filter(d => d.value > 0)
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="badge-blue mb-4 inline-flex items-center gap-2 px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Retail Operations Engine</span>
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
             Aarya <span className="text-blue-600">Bathware</span>
           </h1>
           <p className="text-slate-500 text-xs mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
             <Activity size={14} className="text-blue-600" />
             Active Terminal — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
           </p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 relative z-10">
                 <Bot size={20} className="text-white" />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-1.5">
                    <Zap size={10} className="animate-pulse" /> E BOT 2.0 ENGINE
                 </p>
                 <p className="text-sm font-black text-white uppercase tracking-tighter">AI AGENT: ACTIVE</p>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[200px] rounded-[40px]" />)
        ) : (
          <>
            <StatCard title="Daily Traffic" value={data?.messages?.today ?? 0} sub="Real-time queries" icon={MessageSquare} color="blue" href="/conversations" />
            <StatCard title="Gross Revenue" value={`Rs. ${(data?.orders?.revenue ?? 0).toLocaleString()}`} sub="Current cycle" icon={ShoppingCart} color="green" href="/orders" />
            <StatCard title="Aarya Partners" value={data?.total_customers ?? 0} sub="Registered users" icon={Users} color="purple" href="/customers" />
            <StatCard title="Inventory Stack" value={data?.total_products ?? 0} sub="Active SKU count" icon={Box} color="orange" href="/products" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm xl:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-slate-900 font-extrabold text-2xl tracking-tight uppercase italic">Engagement Telemetry</h2>
              <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-widest">7-Day Interaction Density</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-blue-600" />
               <span className="text-[10px] font-black uppercase text-slate-500">Node Activity</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="skeleton h-64 rounded-[40px]" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorMsg)" dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Distribution */}
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[80px]" />
          
          <div className="mb-10 relative z-10">
            <h2 className="text-white font-extrabold text-2xl tracking-tight uppercase italic">Order Pipeline</h2>
            <p className="text-blue-400 text-[10px] mt-1 font-black uppercase tracking-widest tracking-[0.2em]">Fulfillment Distribution</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
             {pieData.length > 0 ? (
               <div className="relative w-full h-[220px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                       {pieData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-3xl font-black text-white leading-none">{data?.orders?.total || 0}</p>
                    <p className="text-[10px] text-blue-400 font-black uppercase mt-2">Active Units</p>
                 </div>
               </div>
             ) : (
               <div className="text-center text-slate-700 py-10">
                  <Package size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Pipeline Empty</p>
               </div>
             )}

             <div className="w-full mt-10 grid grid-cols-2 gap-4">
                {['Pending', 'Processing', 'Shipped', 'Completed'].map((label, idx) => (
                  <div key={label} className="p-4 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                    </div>
                    <span className="text-xl font-black text-white">
                      {idx === 0 ? data?.orders?.pending : idx === 1 ? data?.orders?.processing : idx === 2 ? data?.orders?.shipped : data?.orders?.completed}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
