'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, ArrowRight, User, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register, business } = useAuth();

  useEffect(() => {
    if (business) {
      router.push('/');
    }
  }, [business, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        toast.success('Account created! Welcome to Aarya AI.');
      } else {
        await login(email, password);
        toast.success('Access granted! Authenticating...');
      }
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden font-sans">
      {/* Left Side: Cinematic Branding & Robot */}
      <div className="hidden lg:flex w-1/2 relative bg-blue-600 flex-col justify-between p-20 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-950 opacity-100" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-400 opacity-10 rounded-full blur-[100px]" 
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl p-2 shadow-2xl shadow-black/20">
              <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">E BOT 2.0</h2>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 shadow-blue-500/50">
                <ShieldCheck size={12} /> Powered by ESYSTEMLK
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-7xl font-black text-white tracking-[1px] leading-[0.9] uppercase mb-8">
              The Evolution <br />
              <span className="text-blue-300">Of AI Bridge</span> <br />
              Management
            </h1>
            <p className="text-blue-100/60 text-lg max-w-sm font-medium leading-relaxed">
              Scale your business communications and inventory with the most advanced WhatsApp AI bridge in the industry.
            </p>
          </motion.div>
        </div>

        {/* The Robot Mascot */}
        <div className="absolute right-[-10%] bottom-[-5%] w-[90%] pointer-events-none select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           <motion.img 
             initial={{ opacity: 0, scale: 0.8, y: 50 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             src="/robot.png" 
             alt="AI Assistant" 
             className="w-full h-auto object-contain"
           />
        </div>

        <div className="relative z-10 flex items-center gap-10">
           <div className="flex flex-col gap-1">
             <span className="text-4xl font-black text-white">99%</span>
             <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Automation Rate</span>
           </div>
           <div className="w-px h-10 bg-blue-400/30" />
           <div className="flex flex-col gap-1">
             <span className="text-4xl font-black text-white">2.5s</span>
             <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Response Time</span>
           </div>
        </div>
      </div>

      {/* Right Side: Auth Form with Flip Effect */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:justify-center p-6 lg:p-8 bg-slate-950 relative overflow-y-auto custom-scrollbar">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <div className="w-full max-w-lg relative z-10 perspective-1000 mt-10 lg:mt-0">
           <motion.div
             initial={false}
             animate={{ rotateY: isRegister ? 180 : 0 }}
             transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
             className="relative preserve-3d w-full min-h-[550px] lg:min-h-[600px] transition-all duration-500"
           >
              {/* Front: SIGN IN */}
              <div className={clsx(
                "w-full bg-white rounded-[32px] lg:rounded-[48px] p-8 lg:p-12 transition-all shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 backface-hidden",
                isRegister ? "invisible opacity-0" : "visible opacity-100"
              )}>
                <div className="mb-8 lg:mb-10">
                   <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter mb-2">Login to E BOT</h2>
                   <p className="text-slate-500 text-xs lg:text-sm font-semibold">Access your E BOT 2.0 control center.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                    <div className="relative group">
                      <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="admin@aaryahardware.lk"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 lg:py-4.5 pl-12 lg:pl-14 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <button type="button" onClick={() => toast.error('Check your registered email.')} className="text-[9px] lg:text-[10px] font-black text-blue-600 uppercase hover:underline">Forgot?</button>
                    </div>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 lg:py-4.5 pl-12 lg:pl-14 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-4 lg:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl lg:rounded-3xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Access Dashboard <ArrowRight size={18} /></>}
                  </button>

                  <p className="text-center mt-6 lg:mt-10 text-slate-400 text-[10px] lg:text-xs font-semibold">
                    New to the AI Matrix? <button type="button" onClick={() => setIsRegister(true)} className="text-blue-600 font-black hover:underline">Create Account</button>
                  </p>
                </form>
              </div>

              {/* Back: SIGN UP */}
              <div className={clsx(
                "absolute inset-0 w-full bg-white rounded-[32px] lg:rounded-[48px] p-8 lg:p-12 transition-all shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 rotate-y-180 backface-hidden",
                !isRegister ? "invisible opacity-0" : "visible opacity-100"
              )}>
                <div className="mb-8 lg:mb-10">
                   <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter mb-2">Join E BOT</h2>
                   <p className="text-slate-500 text-xs lg:text-sm font-semibold">Scale your hardware business.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Your Store Name"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 lg:py-4.5 pl-12 lg:pl-14 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                    <div className="relative group">
                      <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="admin@store.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 lg:py-4.5 pl-12 lg:pl-14 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        required type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 lg:py-4.5 pl-12 lg:pl-14 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-4 lg:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl lg:rounded-3xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                  </button>

                  <p className="text-center mt-6 lg:mt-10 text-slate-400 text-[10px] lg:text-xs font-semibold">
                    Already an Identity? <button type="button" onClick={() => setIsRegister(false)} className="text-blue-600 font-black hover:underline">Access Portal</button>
                  </p>
                </form>
              </div>
           </motion.div>
        </div>

        {/* Branding Footer */}
        <div className="mt-12 lg:mt-16 mb-10 text-center space-y-4">
           <div className="flex items-center justify-center gap-2">
              <Sparkles className="text-blue-600 animate-pulse" size={16} />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Next-Gen Intelligence Powered by ESYSTEMLK</p>
           </div>
           <Link href="https://www.esystemlk.com" target="_blank" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-blue-600 transition-all group active:scale-95 border border-slate-800">
              Developed by <span className="text-blue-400 font-black group-hover:text-white transition-colors">ESYSTEMLK</span>
           </Link>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
