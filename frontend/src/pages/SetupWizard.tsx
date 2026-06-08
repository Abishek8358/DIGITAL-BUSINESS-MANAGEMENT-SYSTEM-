import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Store, Tag, Package, ArrowRight, CheckCircle, Plus, Trash2,
  ArrowLeft, Loader2, MapPin, FileText, CheckCircle2, Info, Zap, Layout, Globe, Activity, Cpu, Fingerprint, ShieldCheck, ShieldAlert, User, Phone, Mail
} from 'lucide-react';

export default function SetupWizard() {
  const [step, setStep] = useState(1);

  // Step 1 — store details (prefilled from registration)
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    categories: [] as string[]
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // Step 2 — categories
  const [newCategory, setNewCategory] = useState('');

  // Step 3 — products
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', categoryId: '', brand: '', costPrice: '', sellingPrice: '',
    gstPercent: '0', stock: '0', minimumStock: '5', reorderQuantity: '10',
    description: '', imageUrl: ''
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Auto-fetch store profile created during registration
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/store/profile');
        const data = res.data;
        setFormData(prev => ({
          ...prev,
          storeName: data.storeName || '',
          ownerName: data.ownerName || '',
          phone:     data.phone     || '',
          email:     data.email     || '',
          address:   data.address   || '',
          gstNumber: data.gstNumber || '',
        }));
      } catch (err) {
        console.error('Failed to load store profile', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !formData.categories.includes(trimmed)) {
      setFormData({ ...formData, categories: [...formData.categories, trimmed] });
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
  };

  const addProduct = () => {
    if (!productForm.name || !productForm.categoryId || !productForm.costPrice) return;
    const calculatedSellingPrice = ((parseFloat(productForm.costPrice || '0')) * (1 + (parseFloat(productForm.gstPercent || '0') / 100))).toFixed(2);
    setProducts([...products, { ...productForm, sellingPrice: calculatedSellingPrice, id: Date.now() }]);
    setProductForm({
      name: '', categoryId: '', brand: '', costPrice: '', sellingPrice: '',
      gstPercent: '0', stock: '0', minimumStock: '5', reorderQuantity: '10',
      description: '', imageUrl: ''
    });
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/api/store/setup', {
        storeName:  formData.storeName,
        ownerName:  formData.ownerName,
        phone:      formData.phone,
        address:    formData.address,
        gstNumber:  formData.gstNumber,
        categories: formData.categories
      });

      const catRes = await api.get('/api/categories');
      const dbCategories = catRes.data;

      for (const prod of products) {
        const catId = dbCategories.find((c: any) => c.name === prod.categoryId)?.id;
        if (catId) {
          await api.post('/api/products', { ...prod, categoryId: catId });
        }
      }

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Setup failed', error);
      const msg = error.response?.data?.error || 'Setup failed. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Store Details', 'Categories', 'Initial Products'];

  if (profileLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
        <p className="text-sm font-bold text-slate-500">Loading setup...</p>
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex lg:items-center justify-center p-3 sm:p-4 selection:bg-indigo-500/30">
      
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500 self-start lg:self-center">
        
        {/* Header Section */}
        <div className="p-5 sm:p-10 pb-6 sm:pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
                <Layout className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">CoreBiz Setup</h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Set up your business environment</p>
              </div>
            </div>
            
            {/* Steps Progress */}
            <div className="flex gap-1.5 sm:gap-2">
                {stepLabels.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${step > idx + 1 ? 'w-8 bg-emerald-500' : step === idx + 1 ? 'w-16 bg-indigo-600' : 'w-8 bg-slate-200 dark:bg-slate-800'}`} />
                ))}
            </div>
          </div>

          <div className="flex mt-6 gap-4 sm:gap-8 items-center overflow-x-auto pb-2 no-scrollbar">
            {stepLabels.map((label, idx) => (
              <div key={label} className={`flex items-center gap-2 sm:gap-3 shrink-0`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all border ${
                  step > idx + 1 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : step === idx + 1 ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  {step > idx + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-widest ${step === idx + 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-10">

          {/* STEP 1: STORE DETAILS */}
          {step === 1 && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <Store className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Store Details</h2>
                </div>
                <div className="p-4 sm:p-5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl sm:rounded-2xl flex items-start gap-3">
                   <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                   <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                     Your basic store details from registration. Please verify and provide your business address to proceed.
                   </p>
                </div>
              </div>

              {/* Read-only Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800">
                <div>
                   <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Store Name</label>
                   <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{formData.storeName}</p>
                </div>
                <div>
                   <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Owner Name</label>
                   <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{formData.ownerName}</p>
                </div>
                <div>
                   <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Phone Number</label>
                   <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{formData.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Address</label>
                  <textarea
                    required
                    className="w-full p-4 sm:p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none shadow-sm"
                    rows={3}
                    placeholder="Enter full address, city, and zip code"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">GST Number (Optional)</label>
                  <input
                    className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm"
                    placeholder="15-digit GSTIN"
                    maxLength={15}
                    value={formData.gstNumber}
                    onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 sm:pt-6">
                <button
                  onClick={handleNext}
                  disabled={!formData.address}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  Next: Set up Categories <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORIES */}
          {step === 2 && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Product Categories</h2>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                    Add categories to organize your products (e.g., Electronics, Clothing, Groceries).
                  </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  autoFocus
                  className="flex-1 p-4 sm:p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm"
                  placeholder="Enter category name"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <button
                  onClick={addCategory}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-3.5 sm:px-8 sm:py-5 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 sm:gap-3 min-h-[140px] sm:min-h-[160px] p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 items-start shadow-inner">
                {formData.categories.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8 text-slate-400">
                        <Tag className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-20" />
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">No categories added yet.</p>
                    </div>
                ) : (
                    formData.categories.map(cat => (
                        <div key={cat} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-2 sm:gap-3 animate-in zoom-in-95 shadow-sm">
                            {cat}
                            <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-500 text-sm sm:text-lg transition-colors cursor-pointer">&times;</button>
                        </div>
                    ))
                )}
              </div>

              <div className="flex justify-between items-center pt-4 sm:pt-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs hover:text-indigo-600 transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={formData.categories.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2.5 sm:gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  Next: Add Products <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL PRODUCTS */}
          {step === 3 && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">Add Initial Products</h2>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                    Add a few products to get started. You can add more later in the Products menu.
                  </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4 sm:space-y-6 shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input className="w-full p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white font-bold text-xs sm:text-sm outline-none shadow-sm"
                      placeholder="e.g. iPhone 15"
                      value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white font-bold text-xs sm:text-sm outline-none shadow-sm appearance-none cursor-pointer"
                      value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                      <option value="">Select Category</option>
                      {formData.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Brand</label>
                    <input className="w-full p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white font-bold text-xs sm:text-sm outline-none shadow-sm"
                      placeholder="Apple"
                      value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { l: 'Cost Price ₹ *', k: 'costPrice', t: 'number' },
                    { l: 'GST %', k: 'gstPercent', t: 'number' },
                    { l: 'Stock', k: 'stock', t: 'number' },
                  ].map((f) => (
                    <div key={f.k} className="space-y-1.5 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{f.l}</label>
                        <input type={f.t} className="w-full p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white font-bold text-xs sm:text-sm outline-none shadow-sm"
                        value={(productForm as any)[f.k]} onChange={e => setProductForm({ ...productForm, [f.k]: e.target.value })} />
                    </div>
                  ))}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Selling Price (Auto)</label>
                    <div className="w-full p-3.5 sm:p-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-500 font-bold text-xs sm:text-sm flex items-center h-[46px] sm:h-[54px] shadow-sm">
                      ₹{((parseFloat(productForm.costPrice || '0')) * (1 + (parseFloat(productForm.gstPercent || '0') / 100))).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <button
                      onClick={addProduct}
                      className="w-full h-[46px] sm:h-[54px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl sm:rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>
                </div>
              </div>

              {products.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-4 py-3 sm:px-8 sm:py-4">Product</th>
                        <th className="px-4 py-3 sm:px-8 sm:py-4">Category</th>
                        <th className="px-4 py-3 sm:px-8 sm:py-4">Price</th>
                        <th className="px-4 py-3 sm:px-8 sm:py-4">Stock</th>
                        <th className="px-4 py-3 sm:px-8 sm:py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                      {products.map(p => (
                        <tr key={p.id} className="text-slate-900 dark:text-white group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 sm:px-8 sm:py-4 font-bold">{p.name}</td>
                          <td className="px-4 py-3 sm:px-8 sm:py-4">
                            <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-[9px] font-bold">{p.categoryId}</span>
                          </td>
                          <td className="px-4 py-3 sm:px-8 sm:py-4 font-bold">₹{p.sellingPrice}</td>
                          <td className="px-4 py-3 sm:px-8 sm:py-4 font-bold">{p.stock} Units</td>
                          <td className="px-4 py-3 sm:px-8 sm:py-4 text-right">
                            <button onClick={() => removeProduct(p.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 sm:pt-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs hover:text-indigo-600 transition-colors cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2.5 sm:gap-3 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer Info */}
        <div className="px-5 py-4 sm:px-10 sm:py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
           <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                <span>CoreBiz SaaS</span>
           </div>
           <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span>Secure Setup</span>
           </div>
        </div>
      </div>
    </div>
  );
}
