import React, { useState, useEffect } from 'react';
import {
  Store,
  CreditCard,
  Box,
  Lock,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Zap,
  Cpu,
  Fingerprint,
  Globe,
  Activity,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import api from '../services/api';

const API_BASE = 'http://localhost:5000';
function resolveLogoUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

type Section = 'profile' | 'billing' | 'inventory' | 'security';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [storeData, setStoreData] = useState({
    storeName: '', ownerName: '', phone: '', email: '', address: '', gstNumber: '', logoUrl: ''
  });

  const [billingData, setBillingData] = useState({
    currency: 'INR', defaultGst: 18, invoicePrefix: 'INV', invoiceFooter: 'Thank you for shopping!'
  });

  const [inventoryData, setInventoryData] = useState({
    lowStockThreshold: 5, criticalStockThreshold: 2, enableNotifications: true
  });

  const [salaryData, setSalaryData] = useState({
    defaultSalesSalary: 0, defaultManagerSalary: 0, defaultHelperSalary: 0
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [storeRes, settingsRes, salaryRes] = await Promise.all([
        api.get('/api/store'),
        api.get('/api/settings/all'),
        api.get('/api/settings/employee-salary')
      ]);

      setStoreData(storeRes.data);
      if (salaryRes.data) {
        setSalaryData(salaryRes.data);
      }
      if (settingsRes.data && settingsRes.data.id) {
        setBillingData({
          currency: settingsRes.data.currency,
          defaultGst: settingsRes.data.default_gst,
          invoicePrefix: settingsRes.data.invoice_prefix,
          invoiceFooter: settingsRes.data.invoice_footer || ''
        });
        setInventoryData({
          lowStockThreshold: settingsRes.data.low_stock_threshold,
          criticalStockThreshold: settingsRes.data.critical_stock_threshold,
          enableNotifications: settingsRes.data.enable_stock_notifications
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setFetching(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/store/update', storeData);
      showToast('Store Profile Updated');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Update Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/settings/billing', billingData);
      showToast('Billing Settings Saved');
    } catch (err: any) {
      showToast('Failed to save billing settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/settings/inventory', inventoryData);
      showToast('Inventory Settings Saved');
    } catch (err: any) {
      showToast('Failed to save inventory settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/settings/employee-salary', salaryData);
      showToast('Salary Rules Saved');
    } catch (err: any) {
      showToast('Failed to save salary rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      await api.put('/api/users/change-password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      showToast('Password Changed Successfully');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Current password incorrect', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'profile', name: 'Store Profile', icon: Store, desc: 'Store identity & contact' },
    { id: 'billing', name: 'Billing Settings', icon: CreditCard, desc: 'Invoice & Tax settings' },
    { id: 'inventory', name: 'Inventory Settings', icon: Box, desc: 'Stock thresholds' },

    { id: 'security', name: 'Security', icon: Lock, desc: 'Account security' },
  ];

  if (fetching) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading settings...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your store configuration and preferences
          </p>
        </div>

        {message.text && (
          <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-10 duration-500 shadow-lg ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900 text-red-600 dark:text-red-400'
            }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as Section)}
              className={`flex items-start gap-4 p-5 rounded-2xl transition-all duration-200 group relative border shadow-sm ${activeSection === s.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeSection === s.id ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400'
                }`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${activeSection === s.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{s.name}</p>
                <p className={`text-xs mt-0.5 ${activeSection === s.id ? 'text-indigo-100' : 'text-slate-500'}`}>{s.desc}</p>
              </div>
              {activeSection === s.id && <ChevronRight className="w-4 h-4 text-white mt-1.5" />}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px]">

            {activeSection === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="p-10 space-y-10 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative group/logo">
                    <div className="w-32 h-32 bg-slate-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover/logo:border-indigo-500 transition-all overflow-hidden shadow-inner">
                      {storeData.logoUrl ? (
                        <img src={resolveLogoUrl(storeData.logoUrl)} alt="Store" className="w-full h-full object-contain p-4 group-hover/logo:scale-110 transition-transform duration-500" />
                      ) : (
                        <Store className="w-10 h-10 text-slate-300" />
                      )}
                      <label className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover/logo:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        <Upload className="w-8 h-8 text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('logo', file);
                          try {
                            setLoading(true);
                            const res = await api.put('/api/store/update', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            setStoreData(res.data);
                            showToast('Logo Updated');
                          } catch (e) { showToast('Upload failed', 'error'); }
                          finally { setLoading(false); }
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Store Logo</h3>
                      <p className="text-sm text-slate-500 font-medium">Update your store logo for branding and invoices.</p>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10"
                        placeholder="Or provide an image URL..."
                        value={storeData.logoUrl || ''}
                        onChange={e => setStoreData({ ...storeData, logoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                        value={storeData.storeName} onChange={e => setStoreData({ ...storeData, storeName: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Owner Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                        value={storeData.ownerName} onChange={e => setStoreData({ ...storeData, ownerName: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                        value={storeData.phone} onChange={e => setStoreData({ ...storeData, phone: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                        value={storeData.email} onChange={e => setStoreData({ ...storeData, email: e.target.value })} required />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Store Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea rows={3} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                        value={storeData.address} onChange={e => setStoreData({ ...storeData, address: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">GST Number</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-500"
                        placeholder="Optional"
                        value={storeData.gstNumber} onChange={e => setStoreData({ ...storeData, gstNumber: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'billing' && (
              <form onSubmit={handleUpdateBilling} className="p-10 space-y-10 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Currency Symbol</label>
                    <input className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-bold text-indigo-600 dark:text-indigo-400 outline-none"
                      value={billingData.currency} onChange={e => setBillingData({ ...billingData, currency: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Default GST %</label>
                    <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold text-slate-900 dark:text-white outline-none"
                      value={billingData.defaultGst} onChange={e => setBillingData({ ...billingData, defaultGst: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Invoice Prefix</label>
                    <input className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                      value={billingData.invoicePrefix} onChange={e => setBillingData({ ...billingData, invoicePrefix: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Invoice Footer</label>
                    <textarea rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 outline-none"
                      value={billingData.invoiceFooter} onChange={e => setBillingData({ ...billingData, invoiceFooter: e.target.value })} />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Billing Settings</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'inventory' && (
              <form onSubmit={handleUpdateInventory} className="p-10 space-y-10 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Low Stock Level</h4>
                    </div>
                    <input type="number" className="w-full p-4 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 rounded-2xl text-2xl font-bold text-amber-600 outline-none shadow-sm"
                      value={inventoryData.lowStockThreshold} onChange={e => setInventoryData({ ...inventoryData, lowStockThreshold: parseInt(e.target.value) })} />
                  </div>
                  <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Critical Stock Level</h4>
                    </div>
                    <input type="number" className="w-full p-4 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-800 rounded-2xl text-2xl font-bold text-red-600 outline-none shadow-sm"
                      value={inventoryData.criticalStockThreshold} onChange={e => setInventoryData({ ...inventoryData, criticalStockThreshold: parseInt(e.target.value) })} />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input type="checkbox" id="notifications" className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={inventoryData.enableNotifications} onChange={e => setInventoryData({ ...inventoryData, enableNotifications: e.target.checked })} />
                    <label htmlFor="notifications" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Enable Stock Notifications (Beta)</label>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Inventory Settings</>}
                  </button>
                </div>
              </form>
            )}



            {activeSection === 'security' && (
              <form onSubmit={handleUpdatePassword} className="p-10 space-y-10 animate-in fade-in duration-300">
                <div className="space-y-6 max-w-sm">
                  {[
                    { l: 'Current Password', v: securityData.currentPassword, k: 'currentPassword' },
                    { l: 'New Password', v: securityData.newPassword, k: 'newPassword' },
                    { l: 'Confirm Password', v: securityData.confirmPassword, k: 'confirmPassword' },
                  ].map((f) => (
                    <div key={f.k} className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{f.l}</label>
                      <input type="password" required className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        value={f.v} onChange={e => setSecurityData({ ...securityData, [f.k]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Update Password</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 opacity-30">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">CoreBiz SaaS</span>
      </div>
    </div>
  );
}
