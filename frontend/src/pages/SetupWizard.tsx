import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Store, Tag, Package, ArrowRight, CheckCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    address: '',
    gstNumber: '',
    categories: [] as string[]
  });
  
  const [newCategory, setNewCategory] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', categoryId: '', brand: '', costPrice: '', sellingPrice: '', 
    gstPercent: '0', stock: '0', minimumStock: '5', reorderQuantity: '10', description: '', imageUrl: ''
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const addCategory = () => {
    if (newCategory && !formData.categories.includes(newCategory)) {
      setFormData({ ...formData, categories: [...formData.categories, newCategory] });
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
  };

  const addProduct = () => {
    if (!productForm.name || !productForm.categoryId || !productForm.costPrice || !productForm.sellingPrice) return;
    setProducts([...products, { ...productForm, id: Date.now() }]);
    setProductForm({
      name: '', categoryId: '', brand: '', costPrice: '', sellingPrice: '', 
      gstPercent: '0', stock: '0', minimumStock: '5', reorderQuantity: '10', description: '', imageUrl: ''
    });
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Setup store and categories
      await api.post('/api/store/setup', {
        storeName: formData.storeName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        gstNumber: formData.gstNumber,
        categories: formData.categories
      });

      // Fetch the newly created categories to get their IDs
      const catRes = await api.get('/api/categories');
      const dbCategories = catRes.data;

      // 2. Add products
      for (const prod of products) {
        // Find the actual DB category ID for the product
        const catId = dbCategories.find((c: any) => c.name === prod.categoryId)?.id;
        if (catId) {
          await api.post('/api/products', {
            ...prod,
            categoryId: catId
          });
        }
      }

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Setup failed', error);
      const msg = error.response?.data?.error || 'Setup failed. Please check your inventory details.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-3xl font-bold">Welcome to CoreBiz</h1>
          <p className="opacity-90 mt-2">Let's get your shop set up.</p>
          
          <div className="flex mt-8 gap-4">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-indigo-400'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-indigo-400'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-white' : 'bg-indigo-400'}`} />
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5" /> Step 1: Store Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-300">Store Name</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g. Tech Haven" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-300">Owner Name</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="John Doe" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-300">Phone Number</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="+1 234 567 890" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-300">GST Number (Optional)</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="GSTIN123456" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-slate-300">Store Address</label>
                <textarea className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} placeholder="123 Business St, City, Country" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleNext} disabled={!formData.storeName || !formData.ownerName || !formData.phone || !formData.address} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5" /> Step 2: Product Categories
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manually add the categories for your inventory (e.g. Groceries, Electronics, Apparel). No defaults are assumed.
              </p>
              
              <div className="flex gap-2">
                <input type="text" className="flex-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} />
                <button onClick={addCategory} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Add</button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-12 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                {formData.categories.length === 0 && <span className="text-slate-400 text-sm">No categories added yet.</span>}
                {formData.categories.map(cat => (
                  <span key={cat} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {cat} <button onClick={() => removeCategory(cat)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 px-4 py-2 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleNext} disabled={formData.categories.length === 0} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5" /> Step 3: Add First Products
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add initial products to your store (optional but recommended).</p>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                    <select className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}>
                      <option value="">Select</option>
                      {formData.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Cost Price</label>
                    <input type="number" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.costPrice} onChange={e => setProductForm({...productForm, costPrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Sell Price</label>
                    <input type="number" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.sellingPrice} onChange={e => setProductForm({...productForm, sellingPrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">GST %</label>
                    <input type="number" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.gstPercent} onChange={e => setProductForm({...productForm, gstPercent: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                    <input type="number" className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                  </div>
                  <div className="flex items-end pt-5">
                    <button onClick={addProduct} className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white py-2 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {products.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="p-3 font-semibold dark:text-white">Product</th>
                        <th className="p-3 font-semibold dark:text-white">Category</th>
                        <th className="p-3 font-semibold dark:text-white">Price</th>
                        <th className="p-3 font-semibold dark:text-white">Stock</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {products.map(p => (
                        <tr key={p.id} className="dark:text-slate-300">
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3">
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-xs">{p.categoryId}</span>
                          </td>
                          <td className="p-3">₹{p.sellingPrice}</td>
                          <td className="p-3">{p.stock}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => removeProduct(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 px-4 py-2 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
                  {loading ? 'Processing...' : 'Complete Setup'} <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
