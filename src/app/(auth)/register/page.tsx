'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Enterprise account activated! Welcome to the network.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Intelligence extraction failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[140px] -ml-64 -mt-64" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-50 rounded-full blur-[140px] -mr-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10"
      >
        {/* Left Side: Brand & Hype */}
        <div className="hidden lg:block space-y-12">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 p-3">
                 <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">eBot</h1>
                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Easy AI for Businesses</p>
              </div>
           </div>

           <div className="space-y-8">
              <h2 className="text-6xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                Grow your business <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">Instantly.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed max-w-md font-medium">
                Connect your inventory, engage customers across WhatsApp, and let eBot handle the complex intelligence of modern commerce.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="p-6 rounded-[32px] bg-blue-50/50 border border-blue-100 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                   <Zap size={22} />
                </div>
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-wide">Fast Setup</h3>
                <p className="text-slate-500 text-xs mt-2 font-medium">Start using your bot in just 2 minutes.</p>
              </div>
              <div className="p-6 rounded-[32px] bg-red-50/50 border border-red-100 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-red-500/5 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 mb-4 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all">
                   <Globe size={22} />
                </div>
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-wide">Global Scale</h3>
                <p className="text-slate-500 text-xs mt-2 font-medium">Speak to customers in 50+ languages effortlessly.</p>
              </div>
           </div>
        </div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white p-12 rounded-[50px] border border-slate-200 shadow-2xl shadow-blue-500/5 relative overflow-hidden"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Create Account</h2>
            <p className="text-slate-500 text-sm font-medium">Start using eBot to help your customers.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600/40 transition-all text-sm font-medium"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  required
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600/40 transition-all text-sm font-medium"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600/40 transition-all text-sm font-medium"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : (
                <>
                  Create Account <Sparkles size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" /> Enterprise Secured
             </div>
             <p className="text-slate-500 text-xs font-bold">
                Member already? <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors ml-1 underline decoration-2 underline-offset-4">Sign in</Link>
             </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
