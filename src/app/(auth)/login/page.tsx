'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, business } = useAuth();

  useEffect(() => {
    if (business) {
      router.push('/');
    }
  }, [business, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Access granted. Welcome to eBot.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication rejected. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-50 rounded-full blur-[120px] -ml-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
           <motion.div 
             initial={{ scale: 0, rotate: -10 }}
             animate={{ scale: 1, rotate: 0 }}
             className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8 border border-slate-100 p-4"
           >
              <img src="/logo.png" alt="eBot Logo" className="w-full h-full object-contain" />
           </motion.div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">eBot <span className="text-blue-600">Login</span></h1>
           <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Manage your business</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-blue-500/5 relative overflow-hidden backdrop-blur-xl">
           <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    required
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600/40 transition-all text-sm font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                   <Link href="#" className="text-[10px] font-black text-blue-600/60 hover:text-blue-600 uppercase tracking-widest">Reset?</Link>
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600/40 transition-all text-sm font-medium"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Logging in...' : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
           </form>
        </div>

        <p className="text-center mt-10 text-slate-500 text-sm font-bold">
          Protected by eBot Security Framework v2.0
        </p>
      </motion.div>
    </div>
  );
}
