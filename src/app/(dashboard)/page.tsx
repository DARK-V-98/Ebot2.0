'use client';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, ShoppingCart, Users, TrendingUp,
  ArrowUpRight, Clock, CheckCircle2, Package, Zap, Bot, Activity
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

const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#ef4444'];

function StatCard({ title, value, sub, icon: Icon, color, href }: any) {
  const colorMap: any = {
    green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  ring: 'ring-green-500/20' },
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   ring: 'ring-blue-500/20'  },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', ring: 'ring-purple-500/20'},
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', ring: 'ring-yellow-500/20'},
  };
  const c = colorMap[color] || colorMap.green;

  const inner = (
    <motion.div 
      whileHover={{ y: -4 }}
      className="stat-card group cursor-pointer h-full"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        <ArrowUpRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
      <div className="mt-4">
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-slate-600 mt-1 font-bold">{sub}</p>}
      </div>
    </motion.div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-[#1e2d4a] border border-white/10 shadow-card text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-brand-400 font-semibold">{payload[0]?.value} messages</p>
    </div>
  );
};

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
        { name: 'Confirmed', value: data.orders.confirmed },
        { name: 'Delivered', value: data.orders.delivered },
        { name: 'Cancelled', value: data.orders.cancelled },
      ].filter(d => d.value > 0)
    : [];

  const orderStatusData = data && data.orders
    ? [
        { label: 'Pending',   count: data.orders.pending,   color: 'text-yellow-400' },
        { label: 'Confirmed', count: data.orders.confirmed, color: 'text-blue-400'   },
        { label: 'Delivered', count: data.orders.delivered, color: 'text-green-400'  },
        { label: 'Cancelled', count: data.orders.cancelled, color: 'text-red-400'    },
      ]
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* AI Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
              System <span className="text-red-600">Command Center</span>
            </h1>
            <p className="text-slate-600 text-xs mt-2 font-black uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-600" />
              Monitoring {business?.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
        </div>
        
        {/* AI Insight Pill */}
        <AnimatePresence mode="wait">
          {insights && !loadingInsights && (
            <motion.div 
              key="insight-pill"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 rounded-bl-xl shadow-lg border-l border-b border-blue-700">
                <p className="text-[9px] font-black text-white uppercase tracking-widest">LIVE AI</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
                <Bot size={24} className="text-blue-600" />
              </div>
              <p className="text-sm text-slate-700 leading-tight font-medium pr-10">
                <span className="font-black text-blue-600 uppercase tracking-tighter mr-1">Insight:</span> {insights.insights[0].text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Stat Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[140px] rounded-2xl" />)
        ) : (
          <>
            <StatCard title="Messages" value={data?.messages?.total ?? 0} sub={`${data?.messages?.today ?? 0} today`} icon={MessageSquare} color="green" href="/conversations" />
            <StatCard title="Sales" value={`Rs. ${(data?.orders?.revenue ?? 0).toLocaleString()}`} sub={`${data?.orders?.total ?? 0} orders total`} icon={ShoppingCart} color="blue" href="/orders" />
            <StatCard title="Customers" value={data?.total_customers ?? 0} sub="Lifetime reach" icon={Users} color="purple" href="/customers" />
            <StatCard title="Active Brain" value={data?.active_users ?? 0} sub="Users this week" icon={Zap} color="yellow" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Advanced Activity Chart */}
        <div className="card p-6 xl:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-slate-900 font-black text-xl tracking-tight">Sales & Messages</h2>
              <p className="text-slate-500 text-xs mt-1 font-bold">Activity overview across the last 7 days</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="skeleton h-64 rounded-xl" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="messages" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#0a0e1a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-600 gap-3">
                <Bot size={40} className="text-slate-700 opacity-20" />
                <p className="text-sm">Link WhatsApp to enable telemetry visualization</p>
             </div>
          )}
        </div>

        {/* Advanced Distribution Analysis */}
        <div className="card p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-slate-900 font-black text-xl tracking-tight">Order Stages</h2>
            <p className="text-slate-500 text-xs mt-1 font-bold">Current customer pipeline status</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
             {isLoading ? (
                <div className="w-40 h-40 rounded-full border-4 border-white/5 animate-spin border-t-brand-500" />
             ) : pieData.length > 0 ? (
               <div className="relative w-full h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-black text-white">{data?.orders?.total || 0}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Pipeline</p>
                 </div>
               </div>
             ) : (
               <div className="text-center text-slate-600 py-10">
                  <Package size={40} className="mx-auto mb-4 opacity-10" />
                  <p className="text-xs">Pipeline empty</p>
               </div>
             )}

             <div className="w-full mt-8 space-y-4">
                {orderStatusData.map((s, idx) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{s.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{s.count}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

       {/* AI Insight Log Matrix */}
       {!loadingInsights && insights && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.insights.map((insight: any) => (
              <motion.div 
                key={insight.id}
                whileHover={{ y: -2 }}
                className="card p-6 bg-white border-slate-200 shadow-sm flex gap-5 hover:border-blue-500/30 transition-all group"
              >
                 <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border", 
                   insight.type === 'trend' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                 )}>
                    {insight.type === 'trend' ? <TrendingUp size={20} strokeWidth={2.5} /> : <Zap size={20} strokeWidth={2.5} />}
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 group-hover:text-blue-600 transition-colors">
                      {insight.type === 'trend' ? 'Behavior Sync' : 'Revenue Optimization'}
                    </h3>
                    <p className="text-sm text-slate-800 font-bold leading-tight uppercase tracking-tight">{insight.text}</p>
                 </div>
              </motion.div>
            ))}
         </div>
       )}
    </motion.div>
  );
}
