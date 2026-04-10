'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, syncProducts } from '@/lib/api';
import { 
  Search, Plus, Edit2, Trash2, Package, Tag, Layers, SearchX, 
  RefreshCw, Globe, Database, HelpCircle, Code, ChevronRight, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';

export default function ProductsPage() {
  const { business } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeView, setActiveView] = useState<'local' | 'live'>('local');
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', stock: 0, image_url: '' });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => getProducts({ search, category }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const filteredProducts = (activeView === 'local' ? products : liveProducts)?.filter((p: any) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  }) || [];

  const isConnected = !!(business as any)?.external_inventory_url;

  useEffect(() => {
    if (isConnected) {
      fetchLiveProducts();
      setActiveView('live');
    }
  }, [isConnected]);

  const fetchLiveProducts = async () => {
    setIsLoadingLive(true);
    try {
      const res = await syncProducts(false);
      setLiveProducts(res.products || []);
      setPreviewItems(res.products || []); // Also sync the preview list
    } catch (err) {
      console.error('Failed to auto-fetch live products');
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      toast.error('External API not configured. Connect your website in Settings.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncProducts(false); // commit = false (Preview mode)
      setPreviewItems(res.products || []);
      setShowPreview(true);
      toast.success(`Fetched ${res.products?.length || 0} items for review.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sync products. Please check your Settings.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeployAll = async () => {
    setIsDeploying(true);
    try {
      const res = await syncProducts(true); // commit = true (Deploy mode)
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowPreview(false);
      setPreviewItems([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deploy products.');
    } finally {
      setIsDeploying(false);
    }
  };

  const openModal = (p?: any) => {
    if (p) {
      setEditId(p.id);
      setFormData({ name: p.name, description: p.description, price: p.price, category: p.category, stock: p.stock || 0, image_url: p.image_url || '' });
    } else {
      setEditId(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: 0, image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateProduct(editId as any, formData);
        toast.success('Product updated');
      } else {
        await createProduct(formData);
        toast.success('Product added');
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteProduct(id as any);
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Product Inventory</h1>
          <p className="text-slate-500 text-sm mt-1 font-bold">Manage what your AI Brain can sell to customers.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
           <button 
            onClick={() => setActiveView('live')}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'live' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
           >
             <Globe size={14} /> Live Website Node
           </button>
           <button 
            onClick={() => setActiveView('local')}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'local' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
           >
             <Database size={14} /> AI Brain Registry
           </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className={clsx(
              "btn-secondary w-full md:w-auto",
              !isConnected && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync From Website'}
          </button>
          <button onClick={() => openModal()} className="btn-primary w-full md:w-auto">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Inventory Connection Status */}
      <div className={clsx(
        "p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all relative overflow-hidden group",
        isConnected ? "bg-emerald-500/5 border-emerald-500/10" : "bg-amber-500/5 border-amber-500/10"
      )}>
        <div className="flex items-center gap-4 relative z-10">
          <div className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg",
            isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          )}>
            {isConnected ? <Globe size={24} /> : <Database size={24} />}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 tracking-tight">
              {isConnected ? 'EXTERNAL API CONNECTED' : 'LOCAL SYSTEM DATABASE'}
              {isConnected && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-1 mt-1">
              <p className="text-xs text-slate-600 font-bold">
                {isConnected 
                  ? (
                    <span className="flex items-center gap-1.5">
                      Endpoint active: <code className="bg-black/40 px-1.5 py-0.5 rounded text-emerald-400/80">{(business as any)?.external_inventory_url?.slice(0, 30)}...</code>
                    </span>
                  )
                  : 'Standalone mode. Connect your website API to automate synchronization.'}
              </p>
              {isConnected && previewItems.length > 0 && (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-600/10 rounded-full border border-blue-600/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{previewItems.length} Products Found on Website</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          {isConnected ? (
             <button 
                onClick={() => setShowDevInfo(true)}
                className="btn-secondary py-2 px-5 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-white"
             >
                <Code size={14} /> API Settings
             </button>
          ) : (
            <Link href="/settings" className="btn-secondary py-2 px-5 text-[10px] font-black uppercase tracking-widest border-red-200 text-red-600 hover:bg-white">
              Setup Website Connection
            </Link>
          )}
        </div>
      </div>

      <div className="card p-5 flex flex-col md:flex-row gap-4 bg-white border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-11"
          />
        </div>
        <div className="relative md:w-64">
          <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="input pl-11 appearance-none"
          >
            <option value="">All Categories</option>
            {categories?.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading || isLoadingLive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="card p-6 h-[250px] bg-slate-50 border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center bg-slate-50 border-slate-200 border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-blue-100/50 flex items-center justify-center mb-6 border border-blue-200 shadow-sm">
            <Package size={40} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Results Found</h3>
          <p className="text-slate-500 max-w-sm mb-6 text-sm">
            {search || category 
              ? 'Refine your filters to discover matching products.'
              : activeView === 'local' 
                ? 'Deploy your first product into the AI Brain cluster or sync from an external node.'
                : 'No products detected on your website node.'}
          </p>
          {(!search && !category && activeView === 'local') && (
            <button onClick={() => openModal()} className="btn-primary px-8">
              <Plus size={18} /> Initialize Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p: any) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key={p.id} 
              className="card-glow p-6 flex flex-col hover:border-blue-500/40 group transition-all duration-300 relative overflow-hidden bg-white border-slate-200"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all text-blue-600 shadow-sm overflow-hidden shrink-0">
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e: any) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <Package size={28} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-slate-400">
                  <button onClick={() => openModal(p)} className="p-2 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 shadow-sm">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-2 hover:text-red-600 transition-colors bg-slate-50 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{p.name}</h3>
                   {p.stock > 0 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                   ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                   )}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 h-8">
                  {p.description || 'No detailed intelligence provided for this item.'}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">UNIT PRICE</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">
                    Rs. {parseFloat(p.price).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="badge-blue">
                    {p.category || 'General'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">STOCK: <span className="text-slate-900 ml-1">{p.stock || 0}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Developer API Specs Modal */}
      <AnimatePresence>
        {showDevInfo && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDevInfo(false)} />
              <motion.div 
                initial={{scale:0.9, opacity:0, y:20}}
                animate={{scale:1, opacity:1, y:0}}
                exit={{scale:0.9, opacity:0, y:20}}
                className="card w-full max-w-2xl relative z-10 p-8 border-brand-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]"
              >
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 border border-brand-500/20">
                           <Code size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">API Specification</h2>
                     </div>
                     <button onClick={() => setShowDevInfo(false)} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="space-y-6">
                      <p className="text-slate-400 text-sm leading-relaxed">
                        To synchronize your internal inventory, your endpoint must return a JSON array in the following format. Our server will automatically map your fields.
                      </p>
                      <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-[11px] leading-relaxed text-blue-400">
                        <pre>
{`{
  "success": true,
  "data": [
    {
      "name": "Luxury Black Faucet",
      "name_sinhala": "සුඛෝපභෝගී කළු කරාමය",
      "price": 8500.00,
      "discount_price": 7500.00,
      "quantity": 15,
      "category": "Bathroom Fittings",
      "image_url": "https://..."
    }
  ]
}`}
                        </pre>
                      </div>
                      <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
                         <p className="text-[10px] font-black uppercase text-brand-400 mb-2 flex items-center gap-2">
                            <Info size={12}/> Connection Tip
                         </p>
                         <p className="text-xs text-slate-400">
                            Our system sends your <strong>External API Key</strong> in the <code>Authorization: Bearer</code> header, AND your custom defined header (e.g. <code>{(business as any)?.external_inventory_header || 'x-api-key'}</code>).
                         </p>
                      </div>
                  </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Deployment Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowPreview(false)} />
            <motion.div 
              initial={{scale:0.95, opacity:0, y:30}}
              animate={{scale:1, opacity:1, y:0}}
              exit={{scale:0.95, opacity:0, y:30}}
              className="card w-full max-w-5xl h-[80vh] relative z-10 flex flex-col bg-white border-blue-500/20 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                    <RefreshCw size={24} className={isDeploying ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Deployment Queue</h2>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Found {previewItems.length} products on external node</p>
                  </div>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {previewItems.map((item, i) => (
                     <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-4 hover:border-blue-500/30 transition-all shadow-sm group">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden flex-shrink-0 group-hover:scale-95 transition-transform duration-500">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                           <h4 className="font-black text-slate-900 truncate text-sm tracking-tight mb-1">{item.name}</h4>
                           <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-blue-600">Rs. {parseFloat(item.price).toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 mt-2 font-medium">Stock: <span className="text-slate-900 font-black">{item.stock}</span></p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                    <Info size={16} />
                    Items in this queue are not yet visible to your customers.
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setShowPreview(false)} className="btn-secondary py-3 px-8 text-[11px] font-black uppercase tracking-widest border-slate-200">
                     Discard
                   </button>
                   <button 
                    onClick={handleDeployAll} 
                    disabled={isDeploying || previewItems.length === 0}
                    className="btn-primary py-3 px-12 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-500/20"
                   >
                     {isDeploying ? 'Deploying...' : <><RefreshCw size={16} /> Initialize All Intelligence</>}
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1,opacity:1}} className="card w-full max-w-lg relative z-10 p-8 shadow-2xl bg-[#0f1629] border-white/5">
            <h2 className="text-2xl font-black text-white mb-8 tracking-tight">
              {editId ? 'Modify Intelligence' : 'Deploy Product'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Name</label>
                <input
                  required type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g. Wireless Pro XL"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Functional Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input py-3 min-h-[100px] resize-y mt-1"
                  placeholder="Describe key features for the AI agent..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (LKR)</label>
                  <input
                    required type="number" step="0.01" min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Stock</label>
                  <input
                    required type="number" min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="input mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Classification</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Image Asset URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="input mt-1"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="pt-8 flex justify-end gap-3 mt-6 border-t border-white/[0.05]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary py-3 px-6">
                  Abort
                </button>
                <button type="submit" className="btn-primary py-3 px-10">
                  {editId ? 'Save Changes' : 'Initialize'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
