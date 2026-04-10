'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/firebaseClient';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export default function WhatsAppPage() {
  const { business, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    if (authLoading || !business) return;

    const unsub = onSnapshot(doc(db, 'businesses', business.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setConfig(data);
        setStatus(data.whatsapp_status || 'disconnected');
        setQrCode(data.whatsapp_qr || null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [business, authLoading]);

  const handleDisconnect = async () => {
    if (!business) return;
    await updateDoc(doc(db, 'businesses', business.id), {
      whatsapp_status: 'disconnected',
      whatsapp_qr: null
    });
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-2 text-slate-900 tracking-tighter">Connect WhatsApp</h1>
      <p className="text-slate-500 mb-8 font-medium">Link your business phone to the AI assistant using a secure QR code.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
          <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500" /> Connection Status
          </h2>
          
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-4 h-4 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
            <span className="capitalize font-black text-2xl text-white tracking-tight">{status}</span>
          </div>

          {status === 'connected' ? (
            <div>
              <p className="text-slate-400 mb-8 leading-relaxed">Your WhatsApp is successfully linked. The AI is now monitoring your messages in real-time.</p>
              <button 
                onClick={handleDisconnect}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Disconnect Device
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-300 mb-8 leading-relaxed">Scan the QR code on the right with your phone (Settings {'>'} Linked Devices) to start.</p>
              <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-100 text-sm font-medium">
                <strong className="text-blue-400 block mb-1 uppercase tracking-widest text-[10px]">Pro Tip</strong>
                Use a WhatsApp Business account for professional features!
              </div>
            </div>
          )}
        </div>

        {/* QR Code Card */}
        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] shadow-2xl border border-slate-800">
          {status === 'connected' ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                ✓
              </div>
              <p className="font-black text-2xl text-white tracking-tighter">System Live</p>
              <p className="text-slate-500 mt-2">Ready to respond</p>
            </div>
          ) : qrCode ? (
            <div className="text-center">
              <div className="bg-white p-6 rounded-3xl mb-6 shadow-2xl inline-block transform hover:scale-105 transition-transform">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 grayscale-0" />
              </div>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Code refreshes every 20s</p>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <div className="w-20 h-20 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
              <p className="font-bold text-white uppercase tracking-widest text-xs">Waiting for Engine...</p>
              <p className="text-[10px] mt-3 opacity-50">Local bridge must be running</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-[32px] p-10">
        <h3 className="text-2xl font-black mb-8 text-slate-900 tracking-tighter">Setup Instructions</h3>
        <div className="space-y-6">
          <div className="flex gap-6 items-start">
            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-900 flex items-center justify-center font-black text-lg">1</span>
            <p className="text-slate-600 font-medium py-2">Open WhatsApp on your phone.</p>
          </div>
          <div className="flex gap-6 items-start">
            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-900 flex items-center justify-center font-black text-lg">2</span>
            <p className="text-slate-600 font-medium py-2">Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong>.</p>
          </div>
          <div className="flex gap-6 items-start">
            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white shadow-md border border-slate-100 text-slate-900 flex items-center justify-center font-black text-lg">3</span>
            <p className="text-slate-600 font-medium py-2">Point your phone at the screen above to scan the QR code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
