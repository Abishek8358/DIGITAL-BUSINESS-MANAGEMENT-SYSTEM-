import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, Search } from 'lucide-react';
import api from '../services/api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!newCategory) return;
    try {
      // Re-using the setup endpoint logic or adding a specific one
      // For simplicity, let's assume we can post to /api/store/setup with just categories
      await api.post('/api/store/setup', { categories: [newCategory] });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      console.error('Add failed', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Categories</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your business product categories.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleAdd} className="flex gap-4">
          <div className="flex-1 relative">
            <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter category name (e.g. Beverages)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Active Categories</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categories.map(cat => (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <span className="font-medium dark:text-white">{cat.name}</span>
              </div>
              <button className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No categories found. Add one above to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
