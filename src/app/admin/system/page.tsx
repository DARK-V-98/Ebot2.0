import { Code, Terminal, Zap, ShieldAlert, ChevronRight } from 'lucide-react';

export default function SystemPage() {
  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase whitespace-pre-wrap">System Diagnostics</h1>
        <p className="text-slate-500 mt-2 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
           <Terminal size={12} className="text-red-500" /> Administrative Telemetry Control
        </p>
      </div>

      <div className="card bg-white border-slate-200 shadow-3xl flex flex-col items-center justify-center p-20 text-center min-h-[600px] rounded-[50px] relative overflow-hidden group">
         <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
         
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-10 shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
               <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                  <Code size={36} strokeWidth={2.5} />
               </div>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">External Sink Required</h2>
            <p className="max-w-md mx-auto text-slate-500 text-sm font-bold leading-relaxed uppercase tracking-tight mb-12">
              Connect a production logging interface (Datadog, Sentry, or ELK Stack) 
              to stream real-time API traces, network performance, and platform-wide execution logs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
               <button className="px-10 py-5 bg-slate-900 hover:bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-500/20 transition-all flex items-center justify-center gap-4 active:scale-95 group/btn">
                  Initialize Log Sink <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
               <button className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95">
                  View Documentation
               </button>
            </div>
         </div>

         {/* Decorative background elements */}
         <div className="absolute bottom-0 right-0 w-64 h-64 border-t border-l border-slate-100/50 rounded-tl-[100px] flex items-center justify-center pointer-events-none">
            <ShieldAlert size={100} className="text-slate-50/50" />
         </div>
         <div className="absolute top-0 left-0 p-10 opacity-10 flex gap-1 pointer-events-none">
            {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-32 bg-red-600 rounded-full" />)}
         </div>
      </div>
    </div>
  );
}
