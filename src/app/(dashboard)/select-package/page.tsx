'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Check, ShieldCheck, Zap, Crown, Phone, ArrowRight, RefreshCw, LogOut } from 'lucide-react';
import { db } from '@/lib/firebase/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const PACKAGES = [
  {
    id: 'basic',
    name: 'Starter Tier',
    price: '5,000',
    limit: 'Under 500 Products',
    icon: Zap,
    color: 'blue'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '7,000',
    limit: 'Up to 1,000 Products',
    icon: ShieldCheck,
    color: 'indigo',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '10,000',
    limit: '1,000+ Products',
    icon: Crown,
    color: 'slate'
  }
];

export default function SelectPackagePage() {
  const { business, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSelect = async (pkgId: string) => {
    if (!business) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        package_status: 'pending',
        subscription_tier: pkgId,
        package_requested_at: new Date().toISOString()
      });
      toast.success('Package requested! Please contact admin for activation.');
      window.location.reload();
    } catch (err: any) {
      toast.error('Failed to request package. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (business?.package_status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] -mr-64 -mt-64" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 lg:p-20 rounded-[48px] shadow-2xl border border-slate-100 max-w-2xl relative z-10"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/30">
            <RefreshCw size={40} className="text-white animate-spin-slow" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6">Verification Pending</h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
            Your business account is currently being reviewed by our team. Once verified, your E BOT 2.0 dashboard will be fully activated.
          </p>
          
          <div className="bg-slate-950 p-8 rounded-3xl text-left mb-10 border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Activation Support</p>
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Phone size={24} />
               </div>
               <div>
                  <p className="text-white font-black text-2xl tracking-tighter">076 571 1396</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Contact Admin to Activate</p>
               </div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-3 text-slate-400 font-bold hover:text-red-600 transition-colors mx-auto"
          >
            <LogOut size={18} /> Exit Portal
          </button>
        </motion.div>

        <p className="mt-12 text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Next-Gen Intelligence by ESYSTEMLK</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-20 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />
      
      <div className="max-w-7xl w-full relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <ShieldCheck size={14} /> Official E BOT 2.0 Pricing
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6 uppercase">
            Choose Your <span className="text-blue-600">Power Level</span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Select the perfect engine to fuel your business automation. Professional setup included with all tiers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {PACKAGES.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={clsx(
                "relative bg-white rounded-[48px] p-10 lg:p-12 transition-all group overflow-hidden border-2",
                pkg.popular ? "border-blue-600 scale-105 z-20" : "border-slate-100 opacity-90 hover:scale-105"
              )}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 py-2 px-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">
                  Best Value
                </div>
              )}

              <div className={clsx(
                 "w-20 h-20 rounded-3xl flex items-center justify-center mb-10 shadow-xl",
                 pkg.color === 'blue' ? "bg-blue-600 text-white" : "",
                 pkg.color === 'indigo' ? "bg-indigo-600 text-white" : "",
                 pkg.color === 'slate' ? "bg-slate-900 text-white" : "",
              )}>
                <pkg.icon size={36} />
              </div>

              <h3 className="text-slate-900 font-black text-2xl mb-2 tracking-tighter uppercase">{pkg.name}</h3>
              <p className="text-slate-500 text-sm font-bold mb-8 opacity-60 uppercase tracking-widest">{pkg.limit}</p>
              
              <div className="flex items-baseline gap-2 mb-10">
                 <span className="text-5xl font-black text-slate-950">Rs.{pkg.price}</span>
                 <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">/mo</span>
              </div>

              <div className="space-y-4 mb-12">
                 {['Mobile Remote Access', 'PC Monitoring Interface', 'AI Intent Detection', 'Live Messaging Dashboard'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-left">
                       <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Check size={12} strokeWidth={4} />
                       </div>
                       <span className="text-slate-600 text-sm font-semibold">{f}</span>
                    </div>
                 ))}
              </div>

              <button 
                disabled={loading}
                onClick={() => handleSelect(pkg.id)}
                className={clsx(
                  "w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                  pkg.popular ? "bg-blue-600 text-white hover:bg-black shadow-xl shadow-blue-500/30" : "bg-slate-100 text-slate-500 hover:bg-slate-950 hover:text-white"
                )}
              >
                {loading ? "Requesting..." : <>Get Started <ArrowRight size={18} /></>}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
           <div className="flex items-center gap-8 py-4 px-10 bg-white/5 rounded-full border border-white/10">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] text-white font-black overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" /></div>)}
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Help from <span className="text-white">ESYSTEMLK</span> Support? <button onClick={() => window.open('tel:0765711396')} className="text-blue-600 hover:underline">076 571 1396</button></p>
           </div>
           
           <button onClick={logout} className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Sign out and exit</button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
