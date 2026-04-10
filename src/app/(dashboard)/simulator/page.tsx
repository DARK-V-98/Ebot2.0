'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Send, Bot, User, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SimulatorPage() {
  const { business } = useAuth();
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'bot'; text: string; time: string }[]>([
    {
      id: 'init',
      role: 'bot',
      text: 'Hi there! This is your AI Sandbox. Type a message below to test how the AI responds to your customers currently.',
      time: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: userMessage,
      time: new Date().toISOString()
    }]);

    setLoading(true);
    try {
      const res = await axios.post('/api/simulator', { message: userMessage });
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'b',
        role: 'bot',
        text: res.data.reply,
        time: res.data.timestamp
      }]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to connect to Brain';
      toast.error(errorMsg);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'e',
        role: 'bot',
        text: `🔥 System Error: ${errorMsg}`,
        time: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: 'init2',
      role: 'bot',
      text: 'Sandbox reset. Start a new conversation!',
      time: new Date().toISOString()
    }]);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-slide-up pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">AI Node Simulator</h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
             Test Mode For: {business?.name || 'Your Business'}
          </p>
        </div>
        <button onClick={handleReset} className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-2xl shadow-sm transition-all active:scale-95">
           <RefreshCcw size={18} />
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 z-10 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[75%] md:max-w-md ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                <div className={`px-6 py-4 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}>
                  <p className="font-medium text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-2 px-2">
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-end gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={18} className="animate-pulse" />
              </div>
              <div className="px-6 py-5 rounded-3xl bg-slate-100 rounded-bl-none w-24">
                 <div className="flex justify-center items-center gap-1.5 h-full">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-100 z-10 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Write a message as a customer..."
               className="w-full bg-slate-50 border border-slate-200 rounded-[28px] py-4 pl-8 pr-16 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-[15px]" 
               disabled={loading}
               autoFocus
             />
             <button 
               type="submit" 
               disabled={!input.trim() || loading}
               className="absolute right-2 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl transition-all active:scale-95 shadow-md shadow-blue-500/20 disabled:shadow-none"
             >
               <Send size={18} className="ml-0.5" />
             </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Live Simulation Node • Bypasses standard rate limits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
