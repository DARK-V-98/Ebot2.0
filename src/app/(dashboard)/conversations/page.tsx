'use client';
import { useQuery } from '@tanstack/react-query';
import { getConversations, resetAISession, deleteConversation } from '@/lib/api';
import { MessageSquare, Search, Phone, Calendar, Hash, ArrowLeft, Bot, User, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConversationsPage() {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastHandoverCount = useRef(0);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    refetchInterval: 5000, 
  });

  // Sound Alert Logic
  useEffect(() => {
    if (conversations) {
      const currentHandoverCount = conversations.filter((c: any) => c.is_handover).length;
      if (currentHandoverCount > lastHandoverCount.current) {
        // Play alert sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio blocked', e));
      }
      lastHandoverCount.current = currentHandoverCount;
    }
  }, [conversations]);

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
                  selectedCustomerId === c.customer_id ? "bg-blue-50/50" : "hover:bg-slate-50",
                  c.is_handover && "bg-red-50/30 animate-pulse border-l-4 border-l-red-600"
                )}
              >
                {selectedCustomerId === c.customer_id && !c.is_handover && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full" />}
                <div className={clsx(
                  "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-xl",
                  c.is_handover ? "bg-red-600 shadow-red-500/20" : "bg-blue-600"
                )}>
                  {c.customer_name?.charAt(0).toUpperCase() || <Phone size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={clsx(
                      "text-sm font-black truncate transition-colors",
                      c.is_handover ? "text-red-700" : (selectedCustomerId === c.customer_id ? "text-blue-600" : "text-slate-900")
                    )}>
                      {c.customer_name || `+${c.customer_phone}`}
                    </p>
                    {c.is_handover && (
                      <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full ml-2">URGENT</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-black uppercase ml-auto">
                      {new Date(c.messages[c.messages.length-1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={clsx(
                    "text-xs truncate font-semibold",
                    c.is_handover ? "text-red-600" : "text-slate-500"
                  )}>
                    {c.is_handover ? "⚠️ CUSTOMER WAITING FOR YOU" : c.messages[c.messages.length-1].content}
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
                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this chat history?')) {
                        await deleteConversation(selectedCustomerId!);
                        window.location.reload();
                      }
                    }}
                    title="Delete Chat" 
                    className="p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all shadow-sm"
                  >
                     <Hash size={20} />
                  </button>
                  <button 
                    onClick={async () => {
                      await resetAISession(selectedCustomerId!);
                      alert('AI Bot is back online for this customer!');
                    }}
                    title="Continue AI Bot" 
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg font-bold text-sm"
                  >
                     <Bot size={18} />
                     <span>Continue AI</span>
                  </button>
               </div>
            </div>
            
            {/* Handover Notice */}
            {selectedConv.messages.some((m: any) => m.intent === 'handover') && (
              <div className="mx-8 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-amber-900 font-bold text-sm leading-none">AI is Paused</p>
                    <p className="text-amber-600 text-[10px] uppercase font-black tracking-widest mt-1">Human Handover Active</p>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700/60 font-medium italic">Customer requested a real person.</p>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth bg-slate-50/30">
               <div className="text-center py-4">
                  <span className="px-5 py-1.5 rounded-full bg-white text-[10px] text-slate-400 font-black border border-slate-100 uppercase tracking-[0.2em] shadow-sm">Communication History</span>
               </div>

               <AnimatePresence initial={false}>
                 {selectedConv.messages?.map((msg: any) => {
                   const isBot = msg.direction === 'outbound' || msg.direction === 'out';
                   const hasMedia = msg.media_type;
                   return (
                     <motion.div 
                        initial={{ opacity: 0, x: isBot ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id} 
                        className={clsx("flex flex-col max-w-[70%]", isBot ? "ml-auto" : "mr-auto")}
                     >
                       <div className={clsx(
                          "px-6 py-4 text-sm rounded-3xl shadow-md font-medium leading-relaxed transition-all overflow-hidden",
                          isBot ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-900 border border-slate-100 rounded-tl-none shadow-sm"
                       )}>
                         {/* --- MEDIA RENDERING --- */}
                         {hasMedia && msg.media_type === 'image' && msg.media_base64 && (
                           <div className="mb-3 rounded-2xl overflow-hidden -mx-2 -mt-1">
                             <img 
                               src={msg.media_base64} 
                               alt="Shared image" 
                               className="w-full max-h-64 object-cover cursor-pointer hover:scale-105 transition-transform"
                               onClick={() => window.open(msg.media_base64, '_blank')}
                             />
                           </div>
                         )}

                         {hasMedia && msg.media_type === 'audio' && (
                           <div className={clsx(
                             "flex items-center gap-3 py-2 px-4 rounded-2xl mb-2 -mx-1",
                             isBot ? "bg-blue-500/30" : "bg-slate-50"
                           )}>
                             <div className={clsx(
                               "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                               isBot ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                             )}>
                               🎤
                             </div>
                             <div className="flex-1">
                               <p className={clsx("text-xs font-bold", isBot ? "text-blue-100" : "text-slate-500")}>
                                 Voice Message
                                 {msg.media_duration && <span className="ml-1 opacity-60">({Math.round(msg.media_duration)}s)</span>}
                               </p>
                               <div className="flex gap-0.5 mt-1">
                                 {Array.from({length: 20}).map((_, i) => (
                                   <div key={i} className={clsx(
                                     "w-1 rounded-full",
                                     isBot ? "bg-white/40" : "bg-blue-300"
                                   )} style={{height: `${Math.random() * 16 + 4}px`}} />
                                 ))}
                               </div>
                             </div>
                           </div>
                         )}

                         {hasMedia && msg.media_type === 'video' && (
                           <div className={clsx(
                             "flex items-center gap-3 py-3 px-4 rounded-2xl mb-2 -mx-1",
                             isBot ? "bg-blue-500/30" : "bg-slate-50"
                           )}>
                             <div className="w-12 h-12 rounded-xl bg-slate-900/20 flex items-center justify-center text-2xl">
                               🎬
                             </div>
                             <div>
                               <p className={clsx("text-xs font-bold", isBot ? "text-blue-100" : "text-slate-700")}>
                                 Video Message
                               </p>
                               {msg.media_duration && (
                                 <p className={clsx("text-[10px]", isBot ? "text-blue-200" : "text-slate-400")}>
                                   Duration: {Math.round(msg.media_duration)}s
                                 </p>
                               )}
                             </div>
                           </div>
                         )}

                         {hasMedia && msg.media_type === 'document' && (
                           <div className={clsx(
                             "flex items-center gap-3 py-3 px-4 rounded-2xl mb-2 -mx-1",
                             isBot ? "bg-blue-500/30" : "bg-slate-50"
                           )}>
                             <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
                               📄
                             </div>
                             <div>
                               <p className={clsx("text-xs font-bold", isBot ? "text-blue-100" : "text-slate-700")}>
                                 {msg.media_filename || 'Document'}
                               </p>
                               <p className={clsx("text-[10px]", isBot ? "text-blue-200" : "text-slate-400")}>
                                 {msg.media_mimetype || 'File attachment'}
                               </p>
                             </div>
                           </div>
                         )}

                         {hasMedia && msg.media_type === 'sticker' && msg.media_base64 && (
                           <div className="mb-2 -mx-2 -mt-1">
                             <img 
                               src={msg.media_base64} 
                               alt="Sticker" 
                               className="w-32 h-32 object-contain"
                             />
                           </div>
                         )}

                         {hasMedia && msg.media_type === 'location' && msg.media_latitude && (
                           <div className="mb-3 rounded-2xl overflow-hidden -mx-2 -mt-1">
                             <a 
                               href={`https://maps.google.com/?q=${msg.media_latitude},${msg.media_longitude}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="block"
                             >
                               <img 
                                 src={`https://maps.googleapis.com/maps/api/staticmap?center=${msg.media_latitude},${msg.media_longitude}&zoom=15&size=400x200&markers=color:red%7C${msg.media_latitude},${msg.media_longitude}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
                                 alt="Location"
                                 className="w-full h-32 object-cover"
                               />
                               <div className={clsx(
                                 "p-2 text-center text-[10px] font-bold",
                                 isBot ? "text-blue-100" : "text-blue-600"
                               )}>
                                 📍 Open in Google Maps
                               </div>
                             </a>
                           </div>
                         )}

                         {/* AI Analysis tag for media */}
                         {hasMedia && msg.media_transcription && (
                           <div className={clsx(
                             "text-[10px] px-3 py-1.5 rounded-xl mb-2 -mx-1 border border-dashed",
                             isBot ? "bg-blue-500/20 border-blue-400/30 text-blue-100" : "bg-purple-50 border-purple-200 text-purple-600"
                           )}>
                             🧠 AI Vision: {msg.media_transcription}
                           </div>
                         )}

                         {/* Text content - show caption for media, or full text for non-media */}
                         {hasMedia && msg.media_caption && (
                           <span>{msg.media_caption}</span>
                         )}
                         {!hasMedia && msg.content && (
                           <span>{msg.content}</span>
                         )}
                       </div>
                       
                       {!isBot && msg.translation && (
                         <div className="mt-2 text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-slate-100 border-dashed">
                           📝 Translation: {msg.translation}
                         </div>
                       )}

                       <div className={clsx("flex items-center gap-2 mt-2.5 px-2", isBot ? "justify-end" : "justify-start")}>
                         {hasMedia && (
                           <span className={clsx(
                             "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                             isBot ? "bg-blue-500 text-blue-100" : "bg-slate-100 text-slate-400"
                           )}>
                             {msg.media_type === 'image' ? '📷' : msg.media_type === 'audio' ? '🎤' : msg.media_type === 'video' ? '🎬' : msg.media_type === 'document' ? '📄' : msg.media_type === 'sticker' ? '🎭' : msg.media_type === 'location' ? '📍' : '📎'} {msg.media_type}
                           </span>
                         )}
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
