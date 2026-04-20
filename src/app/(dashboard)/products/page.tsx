'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '@/lib/api';
import { 
  Search, Plus, Edit2, Trash2, Package, Layers, SearchX, 
  Database, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
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

  const filteredProducts = products || [];

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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">AI Brain Inventory</h1>
          <p className="text-slate-500 text-xs mt-3 font-bold uppercase tracking-widest">Local System Registry</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => openModal()} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card p-5 flex flex-col md:flex-row gap-4 bg-white border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search local intelligence..."
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
      {isLoading ? (
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
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">System Registry Empty</h3>
          <p className="text-slate-500 max-w-sm mb-6 text-sm">
             Deploy your first product into the AI Brain cluster manually.
          </p>
          <button onClick={() => openModal()} className="btn-primary px-8">
            <Plus size={18} /> Initialize Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p: any) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key={p.id} 
              className="card-glow p-6 flex flex-col hover:border-blue-500/40 group transition-all duration-300 relative overflow-hidden bg-white border-slate-200 shadow-sm rounded-[32px]"
            >
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
                   <h3 className="text-xl font-black text-slate-900 truncate tracking-tight uppercase leading-none">{p.name}</h3>
                   {p.stock > 0 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                   ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                   )}
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed line-clamp-2 h-8">
                  {p.description || 'No detailed intelligence provided for this item.'}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">UNIT PRICE</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                    Rs. {parseFloat(p.price).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    {p.category || 'General'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">STOCK: <span className="text-slate-900 ml-1">{p.stock || 0}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1,opacity:1}} className="card w-full max-w-lg relative z-10 p-8 shadow-2xl bg-white border-slate-200 rounded-[40px]">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase leading-none">
              {editId ? 'Adjust Intel' : 'New Entry'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Label</label>
                <input
                  required type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                  placeholder="e.g. Wireless Pro XL"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Context / Description</label>
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Inventory</label>
                  <input
                    required type="number" min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="input mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxonomy / Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="input mt-1 appearance-none bg-slate-50"
                >
                  <option value="">Select Category</option>
                  {categories?.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="other">+ New Category</option>
                </select>
                {formData.category === 'other' && (
                  <input
                    type="text"
                    placeholder="Enter new category name..."
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="input mt-2"
                  />
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Media URI</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="input mt-1"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="pt-8 flex justify-end gap-3 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                  Abort
                </button>
                <button type="submit" className="btn-primary py-3 px-10 rounded-2xl shadow-lg shadow-blue-500/20">
                  {editId ? 'Commit Changes' : 'Initialize'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
