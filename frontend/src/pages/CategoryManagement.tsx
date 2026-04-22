import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, Loader2, Zap, Activity, Globe, Cpu, ShieldAlert, Fingerprint, FolderClosed } from 'lucide-react';
import api from '../services/api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAddLoading(true);
    setError('');
    try {
      await api.post('/api/categories', { name: newCategory.trim() });
      setNewCategory('');
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category may be affected.`)) return;
    setDeleteLoadingId(id);
    try {
      await api.delete(`/api/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <Tags className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Category Settings</h1>
            <p className="text-slate-500 font-medium max-w-sm">
                Manage and organize your products into categories.
            </p>
        </div>
      </div>

      {/* Action Module */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-5 relative z-10">
          <div className="flex-1 relative">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Category Name</label>
            <div className="relative">
                <FolderClosed className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="e.g. Electronics, Clothing..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                />
            </div>
          </div>
          <div className="flex items-end">
            <button 
                type="submit"
                disabled={addLoading || !newCategory.trim()}
                className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
                {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Add Category
            </button>
          </div>
        </form>
        {error && (
          <div className="mt-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
            <ShieldAlert className="w-4 h-4" /> Error: {error}
          </div>
        )}
      </div>

      {/* Registry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Current Categories <span className="text-slate-900 dark:text-white ml-2">({categories.length})</span>
          </h3>
          <Activity className="w-5 h-5 text-indigo-500 opacity-20" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 opacity-40">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium">
              No categories found.
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="p-6 px-10 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Tags className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deleteLoadingId === cat.id}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {deleteLoadingId === cat.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-3 opacity-30">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">CoreBiz SaaS</span>
      </div>
    </div>
  );
}
