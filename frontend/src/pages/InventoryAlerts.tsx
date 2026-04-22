import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, RefreshCw, Layers, ShieldCheck, Activity, Zap, Cpu, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function InventoryAlerts() {
  const [data, setData] = useState<{ variants: any[], products: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/inventory/low-stock');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Scanning inventory...</p>
      </div>
  );

  const totalAlerts = (data?.variants.length || 0) + (data?.products.length || 0);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm ${
                totalAlerts > 0 ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
                {totalAlerts > 0 ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                {totalAlerts > 0 ? 'Low Stock Alert' : 'Inventory Healthy'}
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Stock Alerts
            </h1>
            <p className="text-slate-500 font-medium">
                Monitor products and variants that have fallen below their minimum stock levels.
            </p>
        </div>
        <button 
           onClick={fetchData} 
           className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {totalAlerts === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] text-center border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory is Healthy</h3>
          <p className="text-slate-500 font-medium mt-4 max-w-md mx-auto">
            All products and variants are above their minimum stock thresholds. Refill your inventory as needed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Variants Section */}
          {data?.variants.length! > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group transition-all">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Low Stock Variants</h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">{data?.variants.length} Items</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.variants.map(v => (
                  <div key={v.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative overflow-hidden">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                            {v.productName} <span className="text-slate-300 dark:text-slate-700 mx-1">/</span> {v.brandName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold tracking-tight ${v.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {v.stock} Items
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Min. Threshold: {v.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Products Section */}
          {data?.products.length! > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Low Stock Products</h3>
                </div>
                <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full">{data?.products.length} Items</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.products.map(p => (
                  <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative overflow-hidden">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">{p.brand || 'Standalone'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold tracking-tight ${p.stock === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                        {p.stock} Items
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Min. Stock: {p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-center items-center gap-3 pt-8 opacity-30">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">CoreBiz SaaS Inventory System</span>
      </div>
    </div>
  );
}
