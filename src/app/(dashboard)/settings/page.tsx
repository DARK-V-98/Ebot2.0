'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  Globe, Key, MessageSquare, ShieldCheck, Mail, User, 
  Settings as SettingsIcon, Bot, Zap, Save, Copy, Check, ChevronRight, Layers, HelpCircle, X,
  Link2, Database, Infinity as InfinityIcon, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateSettings } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

function SettingsCard({ title, subtitle, icon: Icon, children, onSave, loading, color = "blue" }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-0 overflow-hidden bg-white border-slate-200 shadow-xl"
    >
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${colorMap[color]}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-extrabold text-xl tracking-tight leading-none mb-1.5 uppercase">{title}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-10 space-y-8">
        {children}
      </div>
      <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button 
          onClick={onSave}
          disabled={loading}
          className="btn-primary py-3.5 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-500/10 active:scale-95 transition-all"
        >
          {loading ? 'Saving...' : <><Save size={16}/> Save Configuration</>}
        </button>
      </div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { business } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const [syncData, setSyncData] = useState({
    external_inventory_url: (business as any)?.external_inventory_url || '',
    external_inventory_key: (business as any)?.external_inventory_key || '',
    external_inventory_header: (business as any)?.external_inventory_header || 'x-api-key',
    inventory_priority: (business as any)?.inventory_priority || 'hybrid', 
    db_host: (business as any)?.db_host || '',
    db_user: (business as any)?.db_user || '',
    db_pass: (business as any)?.db_pass || '',
    db_name: (business as any)?.db_name || '',
    db_query: (business as any)?.db_query || 'SELECT id, name, price, description, category, stock, image_url FROM products WHERE is_active = 1',
    ext_fb_project_id: (business as any)?.ext_fb_project_id || '',
    ext_fb_client_email: (business as any)?.ext_fb_client_email || '',
    ext_fb_private_key: (business as any)?.ext_fb_private_key || '',
    ext_fb_collection: (business as any)?.ext_fb_collection || 'products',
    external_categories_url: (business as any)?.external_categories_url || '',
    external_categories_key: (business as any)?.external_categories_key || '',
    external_categories_header: (business as any)?.external_categories_header || 'x-api-key',
  });

  const [metaData, setMetaData] = useState({
    name: business?.name || '',
    whatsapp_phone_id: business?.whatsapp_phone_id || '',
    whatsapp_token: (business as any)?.whatsapp_token || '',
  });

  const [syncLoading, setSyncLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (business) {
      setSyncData({
        external_inventory_url: (business as any).external_inventory_url || '',
        external_inventory_key: (business as any).external_inventory_key || '',
        external_inventory_header: (business as any).external_inventory_header || 'x-api-key',
        inventory_priority: (business as any).inventory_priority || 'hybrid',
        db_host: (business as any).db_host || '',
        db_user: (business as any).db_user || '',
        db_pass: (business as any).db_pass || '',
        db_name: (business as any).db_name || '',
        db_query: (business as any).db_query || 'SELECT id, name, price, description, category, stock, image_url FROM products WHERE is_active = 1',
        external_categories_url: (business as any).external_categories_url || '',
        external_categories_key: (business as any).external_categories_key || '',
        external_categories_header: (business as any).external_categories_header || 'x-api-key',
      });
      setMetaData({
        name: business.name || '',
        whatsapp_phone_id: (business as any).whatsapp_phone_id || '',
        whatsapp_token: (business as any).whatsapp_token || '',
      });
    }
  }, [business]);

  const handleSaveSync = async () => {
    setSyncLoading(true);
    try {
      await updateSettings(syncData);
      toast.success('Inventory settings updated');
    } catch (err) {
      toast.error('Sync update failed');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSaveMeta = async () => {
    setMetaLoading(true);
    try {
      await updateSettings(metaData);
      toast.success('Core profile updated');
    } catch (err) {
      toast.error('Profile update failed');
    } finally {
      setMetaLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text || '');
    setCopied(type);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!business) return null;

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '';

  return (
    <div className="max-w-4xl space-y-12 animate-slide-up pb-32">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">System Parameters</h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
             <SettingsIcon size={14} className="text-blue-600" /> Platform Engineering
          </p>
        </div>
        <div className="badge-blue flex items-center gap-2 px-4 py-2">
           <Zap size={12} className="fill-current" /> All Nodes Operational
        </div>
      </div>

      <div className="space-y-10">
        <SettingsCard 
          title="Quantum Link" 
          subtitle="Meta WhatsApp Cloud API Connection" 
          icon={Zap} 
          onSave={handleSaveMeta}
          loading={metaLoading}
          color="blue"
        >
          <div className="flex justify-end -mt-12 mb-6">
             <button 
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-200"
             >
                <HelpCircle size={14} /> Connection Guide
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Business Identity Name</label>
              <div className="relative group">
                 <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                 <input 
                    type="text" 
                    value={metaData.name}
                    onChange={e => setMetaData({ ...metaData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" 
                 />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">WhatsApp Phone ID</label>
              <div className="relative group">
                 <MessageSquare size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                 <input 
                    type="text" 
                    value={metaData.whatsapp_phone_id}
                    onChange={e => setMetaData({ ...metaData, whatsapp_phone_id: e.target.value })}
                    placeholder="Enter Meta Phone ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" 
                 />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Meta Access Token</label>
            <div className="relative group">
               <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
               <input 
                  type="password" 
                  value={metaData.whatsapp_token}
                  onChange={e => setMetaData({ ...metaData, whatsapp_token: e.target.value })}
                  placeholder="Paste Meta Graph API Token"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" 
               />
            </div>
          </div>
          
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-6">
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Live Webhook Endpoint</p>
                <div className="flex gap-3">
                   <div className="flex-1 bg-white rounded-2xl px-6 py-3.5 text-xs text-blue-600 font-black border border-slate-200 truncate shadow-sm">
                      {webhookUrl}
                   </div>
                   <button onClick={() => copyToClipboard(webhookUrl, 'webhook')} className="p-3.5 rounded-2xl bg-white text-slate-400 hover:text-blue-600 border border-slate-200 shadow-sm transition-all active:scale-95">
                      {copied === 'webhook' ? <Check size={20} /> : <Copy size={20} />}
                   </button>
                </div>
             </div>
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Meta Verification Secret</p>
                <div className="flex gap-3">
                   <div className="flex-1 bg-white rounded-2xl px-6 py-3.5 text-xs text-blue-600 font-black border border-slate-200 truncate shadow-sm">
                      {(business as any).verify_token || 'aibotbrain_secure_link'}
                   </div>
                   <button onClick={() => copyToClipboard((business as any).verify_token || 'aibotbrain_secure_link', 'vtoken')} className="p-3.5 rounded-2xl bg-white text-slate-400 hover:text-blue-600 border border-slate-200 shadow-sm transition-all active:scale-95">
                      {copied === 'vtoken' ? <Check size={20} /> : <Copy size={20} />}
                   </button>
                </div>
             </div>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Data Bridge" 
          subtitle="Synchronize External Inventory" 
          icon={Globe} 
          onSave={handleSaveSync}
          loading={syncLoading}
          color="blue"
        >
          {/* Inventory Strategy Toggle */}
          <div className="space-y-4 mb-4">
             <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Inventory Routing Protocol</label>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                   { id: 'api', label: 'API EXCLUSIVE', sub: 'Ext. REST API' },
                   { id: 'local', label: 'FIREBASE LOCAL', sub: 'Project DB' },
                   { id: 'fb_ext', label: 'FIREBASE EXT', sub: 'Remote Project' },
                   { id: 'sql', label: 'SQL DIRECT', sub: 'Remote SQL DB' },
                   { id: 'hybrid', label: 'HYBRID NODE', sub: 'Merge Sources' }
                ].map((mode) => (
                   <button
                      key={mode.id}
                      onClick={() => setSyncData({ ...syncData, inventory_priority: mode.id as any })}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                         syncData.inventory_priority === mode.id 
                         ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' 
                         : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                   >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                         syncData.inventory_priority === mode.id ? 'bg-white/20' : 'bg-slate-50'
                      }`}>
                         <div className={`w-2 h-2 rounded-full ${
                            syncData.inventory_priority === mode.id ? 'bg-white animate-pulse' : 'bg-slate-300'
                         }`} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                      <span className={`text-[8px] font-bold uppercase opacity-60 leading-none`}>{mode.sub}</span>
                   </button>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[32px] flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">REST API Link</p>
                   <h3 className="text-xs font-black text-slate-900">External Inventory Endpoint</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                   <Link2 size={18} />
                </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Inventory API Endpoint (URL)</label>
               <input 
                 type="url" 
                 value={syncData.external_inventory_url}
                 onChange={e => setSyncData({ ...syncData, external_inventory_url: e.target.value })}
                 placeholder="https://yourwebsite.com/api/products" 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all text-sm" 
               />
             </div>
          </div>
        </SettingsCard>

        {/* NEW: External Firebase Bridge */}
        <SettingsCard 
          title="Neural Sync" 
          subtitle="Direct Connection to External Firebase Project" 
          icon={InfinityIcon} 
          onSave={handleSaveSync}
          loading={syncLoading}
          color="orange"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Remote Project ID</label>
                <input 
                  type="text" 
                  value={syncData.ext_fb_project_id}
                  onChange={e => setSyncData({ ...syncData, ext_fb_project_id: e.target.value })}
                  placeholder="e.g. your-website-project" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Target Collection Name</label>
                <input 
                  type="text" 
                  value={syncData.ext_fb_collection}
                  onChange={e => setSyncData({ ...syncData, ext_fb_collection: e.target.value })}
                  placeholder="e.g. products" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Client Email (Service Account)</label>
             <input 
               type="text" 
               value={syncData.ext_fb_client_email}
               onChange={e => setSyncData({ ...syncData, ext_fb_client_email: e.target.value })}
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Private Key (Service Account)</label>
             <textarea 
               rows={4}
               value={syncData.ext_fb_private_key}
               onChange={e => setSyncData({ ...syncData, ext_fb_private_key: e.target.value })}
               placeholder="-----BEGIN PRIVATE KEY-----\n..."
               className="w-full bg-slate-900 text-orange-400 font-mono text-[10px] p-6 rounded-[32px] border border-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all leading-relaxed" 
             />
          </div>
        </SettingsCard>

        {/* NEW: SQL Database Bridge */}
        <SettingsCard 
          title="Digital Backbone" 
          subtitle="Direct Remote SQL Connection (MySQL/MariaDB)" 
          icon={Database} 
          onSave={handleSaveSync}
          loading={syncLoading}
          color="orange"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Database Host (IP/Domain)</label>
                <input 
                  type="text" 
                  value={syncData.db_host}
                  onChange={e => setSyncData({ ...syncData, db_host: e.target.value })}
                  placeholder="localhost or 192.168.1.5" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Schema Name (Database)</label>
                <input 
                  type="text" 
                  value={syncData.db_name}
                  onChange={e => setSyncData({ ...syncData, db_name: e.target.value })}
                  placeholder="e.g. shop_database" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Database User</label>
                <input 
                  type="text" 
                  value={syncData.db_user}
                  onChange={e => setSyncData({ ...syncData, db_user: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Database Password</label>
                <input 
                  type="password" 
                  value={syncData.db_pass}
                  onChange={e => setSyncData({ ...syncData, db_pass: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm" 
                />
             </div>
          </div>

          <div className="space-y-2 pt-4">
             <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Custom Extraction Query (SQL)</label>
                <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 uppercase tracking-widest">Read Only Access</span>
             </div>
             <textarea 
               rows={4}
               value={syncData.db_query}
               onChange={e => setSyncData({ ...syncData, db_query: e.target.value })}
               className="w-full bg-slate-900 text-orange-400 font-mono text-xs p-8 rounded-[40px] border border-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all leading-relaxed shadow-2xl" 
             />
             <p className="text-[9px] text-slate-400 font-bold ml-4">
                Tip: Use <code className="text-orange-600">WHERE stock > 0</code> to prevent listing sold-out items. Ensure columns map to: <span className="text-slate-600 underline">id, name, price, description, category, stock, image_url</span>.
             </p>
          </div>
        </SettingsCard>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">API Authentication Key</label>
              <div className="relative group">
                <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="password" 
                  value={syncData.external_inventory_key}
                  onChange={e => setSyncData({ ...syncData, external_inventory_key: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Target Header Name</label>
              <input 
                type="text" 
                value={syncData.external_inventory_header}
                onChange={e => setSyncData({ ...syncData, external_inventory_header: e.target.value })}
                placeholder="x-api-key" 
                className="w-full bg-slate-100 text-blue-600 font-black border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm uppercase tracking-widest shadow-inner" 
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard 
          title="Classification Matrix" 
          subtitle="Independent Category Synchronization" 
          icon={Layers} 
          onSave={handleSaveSync}
          loading={syncLoading}
          color="purple"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Category API Endpoint (URL)</label>
            <input 
              type="url" 
              value={syncData.external_categories_url}
              onChange={e => setSyncData({ ...syncData, external_categories_url: e.target.value })}
              placeholder="https://yourwebsite.com/api/categories (Optional)" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-black placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-purple-500/40 transition-all text-sm" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Optional Category API Key</label>
              <div className="relative group">
                <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                <input 
                  type="password" 
                  value={syncData.external_categories_key}
                  onChange={e => setSyncData({ ...syncData, external_categories_key: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-black focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all text-sm" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Auth Header Name</label>
              <input 
                type="text" 
                value={syncData.external_categories_header}
                onChange={e => setSyncData({ ...syncData, external_categories_header: e.target.value })}
                placeholder="x-api-key" 
                className="w-full bg-slate-100 text-purple-600 font-black border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all text-sm uppercase tracking-widest shadow-inner" 
              />
            </div>
          </div>
        </SettingsCard>

        {/* Global Access Key Section */}
        <div className="card p-1 bg-white border-slate-200 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
           <div className="p-10 relative z-10">
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 transition-transform group-hover:rotate-3">
                    <Zap size={32} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">Developer Credentials</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Global Intelligence ID</p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border border-slate-200 border-dashed rounded-[40px] flex flex-col items-center text-center">
                 <div className="px-5 py-2 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6 shadow-sm">
                    Restricted Access Token
                 </div>
                 <div className="text-2xl font-black text-slate-900 tracking-[0.2em] mb-10 break-all max-w-lg leading-relaxed selection:bg-blue-100">
                    {business.api_key}
                 </div>
                 <button 
                    onClick={() => copyToClipboard((business as any).api_key || '', 'apikey')}
                    className="w-full sm:w-auto py-5 px-16 bg-slate-900 hover:bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-500/20 transition-all flex items-center justify-center gap-4 active:scale-95 group/btn"
                 >
                    {copied === 'apikey' ? 'ID COPIED TO BRAIN' : (
                       <>
                         Copy Access Key <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>

        {/* Hard Reset Section */}
        <div className="card p-1 bg-white border-red-100 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-100 transition-colors" />
           <div className="p-10 relative z-10">
              <div className="flex items-center gap-6 mb-10">
                 <div className="w-16 h-16 rounded-3xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                    <X size={32} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">Developer Controls</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">System Hard Reset & Testing Tools</p>
                 </div>
              </div>

              <div className="p-8 bg-red-50 border border-red-200 border-dashed rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                 <div className="text-left">
                    <h3 className="text-lg font-black text-red-900 mb-2">Eradicate Database Entities</h3>
                    <p className="text-xs text-red-700 font-bold max-w-sm">
                       This will permanently delete all Customers, Messages, Notifications, and active Sessions from your Firebase. Good for wiping simulator tests.
                    </p>
                 </div>
                 <button 
                    onClick={async () => {
                       if (confirm('⚠️ ARMAGEDDON PROTOCOL: Are you 100% sure you want to permanently delete all messages, customers, notifications, and active sessions in your Database? This action is irreversible.')) {
                          try {
                            const res = await fetch('/api/developer/clear-chats', { method: 'POST' });
                            if (res.ok) toast.success('Database NUKED. Chats Cleared.');
                            else toast.error('Failed to clear database.');
                          } catch(e) {
                            toast.error('Network error during reset.');
                          }
                       }
                    }}
                    className="flex-shrink-0 w-full md:w-auto py-5 px-10 bg-red-600 hover:bg-red-700 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                    <X size={16} /> Clear All Chats & Data
                 </button>
              </div>
           </div>
        </div>

      </div>
      {/* WhatsApp Connection Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowGuide(false)} />
            <motion.div 
              initial={{scale:0.95, opacity:0, y:30}}
              animate={{scale:1, opacity:1, y:0}}
              exit={{scale:0.95, opacity:0, y:30}}
              className="card w-full max-w-2xl h-[85vh] relative z-10 flex flex-col bg-white overflow-hidden shadow-2xl border-white/5"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Meta Connection Guide</h2>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">5 Simple steps to link your Brain</p>
                    </div>
                 </div>
                 <button onClick={() => setShowGuide(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                 {/* Step 1 */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">1</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Create Meta Developer Account</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       Go to <a href="https://developers.facebook.com" target="_blank" className="text-blue-600 underline">developers.facebook.com</a>, login with your Facebook account and complete the developer registration.
                    </p>
                 </div>

                 {/* Step 2 */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">2</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Create a Business App</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       Click &ldquo;Create App&rdquo; &rarr; Select &ldquo;Other&rdquo; &rarr; Select &ldquo;Business&rdquo; as the type. Give your app a name and associate it with a Business Portfolio.
                    </p>
                 </div>

                 {/* Step 3 */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">3</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Configure WhatsApp Product</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       Inside your app dashboard, find &ldquo;WhatsApp&rdquo; and click &ldquo;Set up&rdquo;. Connect your official business phone number in the &ldquo;Getting Started&rdquo; section.
                    </p>
                    <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 italic text-[11px] text-amber-700 font-medium">
                       &ldquo;Copy the <strong>Phone Number ID</strong> from here and paste it into our Settings page.&rdquo;
                    </div>
                 </div>

                 {/* Step 4 */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">4</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Setup Webhook & Verification</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       Go to WhatsApp &rarr; Configuration. Click &ldquo;Edit&rdquo; on Webhook.
                    </p>
                    <ul className="mt-3 space-y-2">
                       <li className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                          <Check size={12} className="text-blue-600"/>
                          <strong>Callback URL:</strong> Paste our Webhook URL from Settings.
                       </li>
                       <li className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                          <Check size={12} className="text-blue-600"/>
                          <strong>Verify Token:</strong> Paste our Verification Secret.
                       </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-50 p-4 rounded-xl">
                      IMPORTANT: After saving, click &ldquo;Manage&rdquo; next to Webhook Fields and <strong>subscribe to &apos;messages&apos;</strong> event.
                    </p>
                 </div>

                 {/* Step 5 */}
                 <div className="relative pl-12 pb-4">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-blue-500/20 shadow-lg">5</div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Generate System User Token</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       Do not use a temporary token! Go to Business Settings &rarr; Users &rarr; System Users. Add a user, and click &ldquo;Generate Token&rdquo;.
                    </p>
                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-700 font-bold">
                       Select &apos;whatsapp_business_messaging&apos; permission. Copy that token and paste it into the <strong>Meta Access Token</strong> field.
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white shrink-0">
                 <button onClick={() => setShowGuide(false)} className="btn-primary w-full py-4 text-xs font-black tracking-widest uppercase">
                    I Have Configured Everything
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
