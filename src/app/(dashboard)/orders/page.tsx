'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus } from '@/lib/api';
import { ShoppingCart, CheckCircle2, Package, XCircle, Search, Clock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import clsx from 'clsx';

const STATUS_STLYES: any = {
  'pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
  'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_ICONS: any = {
  'pending': Clock,
  'confirmed': CheckCircle2,
  'delivered': Package,
  'cancelled': XCircle,
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  });

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders?.filter((o: any) => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Order Management</h1>
          <p className="text-slate-500 text-sm mt-1 font-bold">Track and fulfill all bot-processed purchases.</p>
        </div>
      </div>

      <div className="card p-5 bg-white border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Total Volume</span>
              <span className="text-lg font-black text-slate-900 leading-none">{filteredOrders?.length || 0}</span>
           </div>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border-slate-200 shadow-xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Matrix Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-6 py-6" colSpan={5}><div className="skeleton h-8 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                       <ShoppingCart size={48} className="text-slate-200 mb-4" />
                       <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No transaction history found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((o: any) => {
                  const StatusIcon = STATUS_ICONS[o.status] || Clock;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-6 border-b border-slate-50 font-black text-xs text-blue-600">
                        #{o.id.slice(0,8).toUpperCase()}
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50">
                        <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{o.customer_name || 'Walking Customer'}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">ITEMS: {o.items?.length || 1}</p>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50 font-black text-slate-900">
                        Rs. {parseFloat(o.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50">
                        <div className="relative inline-block w-full max-w-[160px]">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 py-2.5 px-4 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all uppercase tracking-widest"
                          >
                            <option value="pending">Mark Pending</option>
                            <option value="confirmed">Confirm Order</option>
                            <option value="delivered">Mark Delivered</option>
                            <option value="cancelled">Cancel Order</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50 text-right">
                        <span className={clsx(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm transition-all group-hover:scale-105",
                          STATUS_STLYES[o.status] || STATUS_STLYES['pending']
                        )}>
                          <StatusIcon size={14} strokeWidth={3} />
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
