'use client';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/lib/api';
import { MessageSquare, Search, Phone, Calendar, Hash, ArrowLeft, Bot, User } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConversationsPage() {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    refetchInterval: 5000, 
  });

  const filtered = conversations?.filter((c: any) => 
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.customer_phone?.includes(search)
  );

  const selectedConv = conversations?.find((c: any) => c.customer_id === selectedCustomerId);

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in">
      {/* Sidebar - Conversation List */}
      <motion.div 
        layout
        className="w-96 flex flex-col card overflow-hidden bg-white border-slate-200 shadow-xl"
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-5">
             <h2 className="text-slate-900 font-extrabold text-xl flex items-center gap-2 tracking-tight">
               <MessageSquare size={20} className="text-blue-600" /> Messages
             </h2>
             <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase tracking-widest">Live Hub</span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white text-sm text-slate-900 rounded-2xl pl-11 pr-4 py-3 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 border-b border-slate-50 flex gap-4 transition-opacity opacity-50">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-1/2 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-3 w-full bg-slate-100 rounded-lg animate-pulse" />
                </div>
              </div>
            ))
          ) : filtered?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active threads found.</div>
          ) : (
            filtered?.map((c: any) => (
              <motion.div
                layout
                key={c.customer_id}
                onClick={() => setSelectedCustomerId(c.customer_id)}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "p-6 border-b border-slate-50 cursor-pointer transition-all flex gap-4 relative group",
                  selectedCustomerId === c.customer_id ? "bg-blue-50/50" : "hover:bg-slate-50"
                )}
              >
                {selectedCustomerId === c.customer_id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full" />}
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-xl">
                  {c.customer_name?.charAt(0).toUpperCase() || <Phone size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={clsx(
                      "text-sm font-black truncate transition-colors",
                      selectedCustomerId === c.customer_id ? "text-blue-600" : "text-slate-900"
                    )}>
                      {c.customer_name || `+${c.customer_phone}`}
                    </p>
                    <span className="text-[10px] text-slate-400 font-black uppercase">
                      {new Date(c.messages[c.messages.length-1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-semibold">
                    {c.messages[c.messages.length-1].content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 card flex flex-col bg-white overflow-hidden border-slate-200 relative shadow-2xl">
        {selectedConv ? (
          <>
            <div className="px-8 py-5 border-b border-slate-100 bg-white/80 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform hover:scale-105">
                    <User size={28} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-slate-900 font-black text-xl tracking-tight leading-none mb-1.5 uppercase">
                     {selectedConv.customer_name || 'Guest User'}
                   </h3>
                   <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                      </span>
                      <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                        <Phone size={12} className="text-slate-400" /> +{selectedConv.customer_phone}
                      </p>
                   </div>
                 </div>
               </div>
               
               <div className="flex gap-3">
                  <button title="Calendar" className="p-3 rounded-2xl bg-slate-50 text-slate-500 hover:text-blue-600 border border-slate-100 hover:bg-white transition-all shadow-sm">
                     <Calendar size={20} />
                  </button>
                  <button title="Details" className="p-3 rounded-2xl bg-slate-50 text-slate-500 hover:text-blue-600 border border-slate-100 hover:bg-white transition-all shadow-sm">
                     <Hash size={20} />
                  </button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth bg-slate-50/30">
               <div className="text-center py-4">
                  <span className="px-5 py-1.5 rounded-full bg-white text-[10px] text-slate-400 font-black border border-slate-100 uppercase tracking-[0.2em] shadow-sm">Communication History</span>
               </div>

               <AnimatePresence initial={false}>
                 {selectedConv.messages?.map((msg: any) => {
                   const isBot = msg.direction === 'outbound' || msg.direction === 'out';
                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: isBot ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id} 
                        className={clsx("flex flex-col max-w-[70%]", isBot ? "ml-auto" : "mr-auto")}
                     >
                       <div className={clsx(
                          "px-6 py-4 text-sm rounded-3xl shadow-md font-medium leading-relaxed transition-all",
                          isBot ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-900 border border-slate-100 rounded-tl-none shadow-sm"
                       )}>
                         {msg.content}
                       </div>
                       <div className={clsx("flex items-center gap-2 mt-2.5 px-2", isBot ? "justify-end" : "justify-start")}>
                         {isBot ? <Bot size={12} className="text-blue-600"/> : <User size={12} className="text-slate-400"/>}
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white shadow-[-10px_0_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-center gap-4 px-8 py-4 rounded-3xl bg-slate-50 border border-slate-100 border-dashed transition-all hover:bg-white hover:border-blue-200 group">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_#2563eb]" />
                <p className="text-[11px] text-slate-900 font-black uppercase tracking-[0.1em] group-hover:text-blue-600 transition-colors">
                  eBot Autonomous Monitoring Active
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-16 animate-fade-in">
            <div className="w-32 h-32 rounded-[40px] bg-blue-50 border border-blue-100 flex items-center justify-center mb-10 rotate-3 shadow-xl shadow-blue-500/5">
              <MessageSquare size={56} className="text-blue-600/30" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Select Account</h3>
            <p className="text-slate-500 max-w-sm text-base leading-relaxed font-medium">
              Choose a message thread from the sidebar to view current communication status and bot intelligence logs.
            </p>
            <div className="mt-12 flex gap-10">
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">{conversations?.length || 0}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Active Threads</span>
               </div>
               <div className="w-px h-12 bg-slate-100" />
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-blue-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Live
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Network Status</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
