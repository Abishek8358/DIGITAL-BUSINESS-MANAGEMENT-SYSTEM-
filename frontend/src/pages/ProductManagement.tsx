import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, Edit2, X, Loader2, ChevronDown, ChevronRight,
  Package, Tag, Layers, Image as ImageIcon, Check, AlertCircle, PackagePlus, Zap, Activity, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1581091215367-9b6c00b3035a?w=400&q=80';

// ── Variant Row ──────────────────────────────────────────────────────────────
function VariantRow({ variant, onRefresh, isAdmin }: any) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...variant });
  const [saving, setSaving] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addStockQty, setAddStockQty] = useState('');
  const [addStockLoading, setAddStockLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/variants/${variant.id}`, {
        variantName: form.variantName, sellingPrice: form.sellingPrice,
        costPrice: form.costPrice, gstPercent: form.gstPercent,
        stock: form.stock, minimumStock: form.minimumStock, imageUrl: form.imageUrl
      });
      setEditing(false);
      onRefresh();
    } catch (e: any) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete variant "${variant.variantName}"?`)) return;
    await api.delete(`/api/variants/${variant.id}`);
    onRefresh();
  };

  const handleAddStock = async () => {
    const qty = parseInt(addStockQty);
    if (!qty || qty <= 0) return alert('Enter a valid quantity');
    setAddStockLoading(true);
    try {
      await api.put(`/api/variants/add-stock/${variant.id}`, { quantity: qty });
      setAddStockOpen(false);
      setAddStockQty('');
      onRefresh();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed to add stock'); }
    finally { setAddStockLoading(false); }
  };

  if (editing) {
    return (
      <div className="ml-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in duration-300 shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Variant Name</label>
            <input className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5"
              value={form.variantName} onChange={e => setForm({ ...form, variantName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Selling Price ₹</label>
            <input type="number" className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-sm outline-none"
              value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Cost Price ₹</label>
              <input type="number" className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 font-bold text-sm shadow-sm outline-none"
                value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">GST %</label>
            <input type="number" className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold shadow-sm outline-none"
              value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Stock</label>
            <input type="number" className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold shadow-sm outline-none"
              value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Min. Alert</label>
            <input type="number" className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold shadow-sm outline-none"
              value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: e.target.value })} />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Image URL</label>
            <input
              placeholder="https://..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium shadow-sm outline-none"
              value={form.imageUrl || ''}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
          </button>
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
             Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {addStockOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 w-full max-w-sm p-10 space-y-8 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                    <PackagePlus className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-slate-900 dark:text-white">Add Stock</h4>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{variant.variantName}</p>
                </div>
              </div>
              <button onClick={() => { setAddStockOpen(false); setAddStockQty(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Inventory</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">{variant.stock}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity to Add</label>
              <input
                autoFocus type="number" min="1" placeholder="0"
                className="w-full p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-white text-3xl font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all text-center shadow-inner outline-none"
                value={addStockQty}
                onChange={e => setAddStockQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStock()}
              />
            </div>
            <button
              onClick={handleAddStock}
              disabled={addStockLoading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
            >
              {addStockLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Stock'}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 px-6 py-4 ml-8 bg-white dark:bg-slate-900 rounded-2xl group transition-all border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/40">
        <div className={`w-2 h-2 rounded-full ${variant.stock <= variant.minimumStock ? 'bg-red-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-300">{variant.variantName}</span>
        <div className="flex items-center gap-4">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">₹{Number(variant.sellingPrice).toLocaleString()}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${variant.stock <= variant.minimumStock ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
              {variant.stock} Items
            </span>
        </div>
        {isAdmin && (
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => setAddStockOpen(true)} className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 rounded-xl transition-all hover:scale-110" title="Add Stock"><PackagePlus className="w-4 h-4" /></button>
            <button onClick={() => setEditing(true)} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 rounded-xl transition-all hover:scale-110" title="Edit"><Edit2 className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-2 bg-red-50 text-red-600 dark:bg-red-950/20 rounded-xl transition-all hover:scale-110" title="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Add Variant form ────────────────────────────────────────────────────────
function AddVariantForm({ brandId, onDone }: any) {
  const [form, setForm] = useState({ variantName: '', sellingPrice: '', costPrice: '', gstPercent: '0', stock: '0', minimumStock: '5', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/api/variants', { brandId, ...form }); onDone(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to add variant'); }
    finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="ml-10 mt-4 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-indigo-200 dark:border-indigo-900/40 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-xl">
      <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">New Variant Details</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Variant Name *</label>
          <input required placeholder="E.g. 8GB, 128GB, Red" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm outline-none"
            value={form.variantName} onChange={e => setForm({ ...form, variantName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Selling Price ₹ *</label>
          <input type="number" required min="0" step="0.01" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 font-bold text-lg"
            value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Cost Price ₹</label>
          <input type="number" min="0" step="0.01" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold text-sm"
            value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">GST %</label>
          <input type="number" min="0" max="100" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm"
            value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Stock</label>
          <input type="number" min="0" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm"
            value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Min. Alert</label>
          <input type="number" min="0" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm"
            value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: e.target.value })} />
        </div>
        <div className="col-span-1 sm:col-span-2 md:col-span-3 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Image URL</label>
          <input
            placeholder="https://..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium outline-none"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-4">
        <button type="submit" disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Variant
        </button>
        <button type="button" onClick={() => onDone(false)}
          className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 shadow-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Brand Row ─────────────────────────────────────────────────────────────
function BrandRow({ brand, onRefresh, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);

  const handleDeleteBrand = async () => {
    if (!window.confirm(`Delete brand "${brand.name}" and ALL its variants?`)) return;
    await api.delete(`/api/brands/${brand.id}`);
    onRefresh();
  };

  const variantCount = brand.variants?.length || 0;

  return (
    <div className="ml-10 border-l-2 border-slate-100 dark:border-slate-800 pl-6 space-y-3">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-4 py-3.5 px-6 rounded-[1.5rem] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-all relative border border-transparent shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-800"
      >
        <div className={`absolute left-[-26px] top-1/2 w-4 h-[2px] bg-slate-100 dark:bg-slate-800`} />
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        <Layers className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{brand.name}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{variantCount} Variant{variantCount !== 1 ? 's' : ''}</span>
        <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {isAdmin && (
            <>
              <button onClick={e => { e.stopPropagation(); setAddingVariant(true); setOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all">
                <Plus className="w-3 h-3" /> Add Variant
              </button>
              <button onClick={e => { e.stopPropagation(); handleDeleteBrand(); }}
                className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="space-y-2 pb-4 animate-in slide-in-from-top-2 duration-300">
          {brand.variants?.map((v: any) => (
            <VariantRow key={v.id} variant={v} onRefresh={onRefresh} isAdmin={isAdmin} />
          ))}
          {brand.variants?.length === 0 && !addingVariant && (
             <div className="flex items-center gap-3 ml-12 text-[10px] font-bold text-slate-400 py-3 uppercase tracking-widest italic opacity-50">
                No variants found
             </div>
          )}
          {addingVariant && (
            <AddVariantForm brandId={brand.id} onDone={() => { setAddingVariant(false); onRefresh(); }} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onRefresh, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [addingBrandLoading, setAddingBrandLoading] = useState(false);

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    setAddingBrandLoading(true);
    try {
      await api.post('/api/brands', { productId: product.id, name: newBrandName.trim() });
      setNewBrandName('');
      setAddingBrand(false);
      onRefresh();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed to add brand'); }
    finally { setAddingBrandLoading(false); }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(`Delete product "${product.name}" and ALL its brands and variants?`)) return;
    await api.delete(`/api/products/${product.id}`);
    onRefresh();
  };

  const totalVariants = product.brands?.reduce((sum: number, b: any) => sum + (b.variants?.length || 0), 0) || 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden group/card shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all duration-500">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-6 p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
      >
        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-500">
          <img src={product.imageUrl || DEFAULT_IMG} alt={product.name}
            className="w-full h-full object-cover"
            onError={(e: any) => { e.target.src = DEFAULT_IMG; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {open ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">{product.name}</h3>
          </div>
          <div className="flex items-center gap-3 ml-8 mt-1">
            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
              {product.categoryName || 'General'}
            </span>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {product.brands?.length || 0} Brands &bull; {totalVariants} Variants
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
            <button
               onClick={e => { e.stopPropagation(); setAddingBrand(true); setOpen(true); }}
               className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
             >
               <Plus className="w-4 h-4" /> Add Brand
             </button>
            <button onClick={e => { e.stopPropagation(); handleDeleteProduct(); }}
              className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-sm">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="px-10 pb-10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-6" />
          
          {product.brands?.length === 0 && !addingBrand && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 animate-in fade-in duration-500">
               <Layers className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-xs font-bold uppercase tracking-widest opacity-50">No brands configured for this product</p>
            </div>
          )}
          {product.brands?.map((brand: any) => (
            <BrandRow key={brand.id} brand={brand} onRefresh={onRefresh} isAdmin={isAdmin} />
          ))}

          {isAdmin && (
            addingBrand ? (
              <div className="ml-14 mt-6 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1 relative">
                    <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <input
                      autoFocus type="text" placeholder="Enter brand name (e.g. Apple, Samsung)"
                      className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
                    />
                </div>
                <button onClick={handleAddBrand} disabled={addingBrandLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                  {addingBrandLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setAddingBrand(false)}
                  className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-red-500 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button onClick={() => setAddingBrand(true)}
                className="flex items-center gap-3 ml-14 mt-4 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors uppercase tracking-widest group">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                </div>
                Add New Brand
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProductManagement() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'owner'].includes(user?.role || '');

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', categoryId: '', imageUrl: '', description: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        api.get('/api/products/hierarchy'),
        api.get('/api/categories')
      ]);
      setHierarchy(hRes.data);
      setCategories(cRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

   useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setAddLoading(true);
    try {
      if (!addForm.categoryId) return alert('Select a category');
      await api.post('/api/products', { ...addForm, brand: '', costPrice: '0', sellingPrice: '0', gstPercent: '0', stock: '0' });
      setAddForm({ name: '', categoryId: '', imageUrl: '', description: '' });
      setShowAddProduct(false); fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create product');
    }
    finally { setAddLoading(false); }
  };

  const filtered = hierarchy.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brands?.some((b: any) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.variants?.some((v: any) => v.variantName.toLowerCase().includes(search.toLowerCase()))
      );
    const matchCat = filterCategory === 'all' || p.categoryId?.toString() === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Products
            </h1>
            <p className="text-slate-500 font-medium">
                Manage your product hierarchy, brands, and inventory variants.
            </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4.5 rounded-[1.5rem] text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm items-center">
        <div className="relative flex-1 w-full max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="text" placeholder="Search products, brands or variants..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />
        <select
          className="w-full sm:w-auto px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-500 outline-none cursor-pointer appearance-none text-center"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Product</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Create a new base product entry</p>
               </div>
               <button onClick={() => setShowAddProduct(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Product Name *</label>
                    <div className="relative">
                        <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                        <input required className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-inner"
                        placeholder="e.g. iPhone, Laptop, T-Shirt"
                        value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category *</label>
                    <div className="relative">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                        <select required className="w-full pl-14 pr-10 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none cursor-pointer appearance-none shadow-inner"
                        value={addForm.categoryId} onChange={e => setAddForm({ ...addForm, categoryId: e.target.value })}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Image URL (Optional)</label>
                    <div className="relative">
                        <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-medium text-sm outline-none shadow-inner"
                        placeholder="https://images.unsplash.com/..."
                        value={addForm.imageUrl} onChange={e => setAddForm({ ...addForm, imageUrl: e.target.value })} />
                    </div>
                </div>
              </div>

              <div className="p-5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/10 rounded-2xl flex items-start gap-3">
                 <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                 <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Product created! Now expand it to add brands and inventory variants with pricing.
                 </p>
              </div>

              <button type="submit" disabled={addLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Create Product</> }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading products...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-40 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-1000">
          <Package className="w-20 h-20 mx-auto mb-6 text-slate-200 dark:text-slate-800" />
          <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">{search ? 'No matches found' : 'Product catalog is empty'}</p>
          <p className="text-sm font-medium text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-1000">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onRefresh={fetchData} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
