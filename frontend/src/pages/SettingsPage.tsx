import React, { useState, useEffect } from 'react';
import { 
  Store, 
  CreditCard, 
  Box, 
  Palette, 
  Lock, 
  Save, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  DollarSign
} from 'lucide-react';
import api from '../services/api';

type Section = 'profile' | 'billing' | 'inventory' | 'salary' | 'appearance' | 'security';

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

  const [appearance, setAppearance] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [storeRes, settingsRes, salaryRes] = await Promise.all([
        api.get('/api/store'),
        api.get('/api/settings/all'), // This returns all store settings
        api.get('/api/settings/employee-salary')
      ]);
      
      setStoreData(storeRes.data);
      if (salaryRes.data) {
        setSalaryData(salaryRes.data);
      }
      if (settingsRes.data.id) {
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
      showToast('Store profile updated successfully');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/settings/billing', billingData);
      showToast('Billing settings saved');
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
      showToast('Inventory thresholds updated');
    } catch (err: any) {
      showToast('Failed to update inventory settings', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/settings/employee-salary', salaryData);
      showToast('Salary defaults saved');
    } catch (err: any) {
      showToast('Failed to save salary settings', 'error');
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
      showToast('Password changed successfully');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceChange = (mode: string) => {
    setAppearance(mode);
    localStorage.setItem('theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    showToast(`Theme set to ${mode}`);
  };

  const sections = [
    { id: 'profile', name: 'Store Profile', icon: Store },
    { id: 'billing', name: 'Billing & Tax', icon: CreditCard },
    { id: 'inventory', name: 'Inventory Settings', icon: Box },
    { id: 'salary', name: 'Salary Configuration', icon: DollarSign },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Lock },
  ];

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your store configuration and preferences.</p>
        </div>
        
        {message.text && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as Section)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeSection === s.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <s.icon className="w-5 h-5" />
              {s.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {activeSection === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                    {storeData.logoUrl ? (
                      <img src={storeData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-slate-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Store Logo</h3>
                    <p className="text-xs text-slate-500 mt-1">Recommended size: 200x200px. JPG or PNG.</p>
                    <input 
                      type="text" 
                      placeholder="Logo URL" 
                      className="mt-2 text-xs w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 dark:text-white"
                      value={storeData.logoUrl}
                      onChange={e => setStoreData({...storeData, logoUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Name</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.storeName}
                      onChange={e => setStoreData({...storeData, storeName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Name</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.ownerName}
                      onChange={e => setStoreData({...storeData, ownerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.phone}
                      onChange={e => setStoreData({...storeData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Email</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.email}
                      onChange={e => setStoreData({...storeData, email: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Address</label>
                    <textarea 
                      rows={3}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.address}
                      onChange={e => setStoreData({...storeData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Number</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={storeData.gstNumber}
                      onChange={e => setStoreData({...storeData, gstNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'billing' && (
              <form onSubmit={handleUpdateBilling} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency Symbol</label>
                    <input 
                      placeholder="e.g. ₹ or $"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={billingData.currency}
                      onChange={e => setBillingData({...billingData, currency: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default GST %</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={billingData.defaultGst}
                      onChange={e => setBillingData({...billingData, defaultGst: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Prefix</label>
                    <input 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={billingData.invoicePrefix}
                      onChange={e => setBillingData({...billingData, invoicePrefix: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Footer Note</label>
                    <textarea 
                      rows={2}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      placeholder="Thank you for your business!"
                      value={billingData.invoiceFooter}
                      onChange={e => setBillingData({...billingData, invoiceFooter: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Billing Settings</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'inventory' && (
              <form onSubmit={handleUpdateInventory} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Threshold</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={inventoryData.lowStockThreshold}
                      onChange={e => setInventoryData({...inventoryData, lowStockThreshold: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Stock Threshold</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={inventoryData.criticalStockThreshold}
                      onChange={e => setInventoryData({...inventoryData, criticalStockThreshold: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3 py-4">
                    <input 
                      type="checkbox"
                      id="notifications"
                      className="w-5 h-5 text-indigo-600 rounded"
                      checked={inventoryData.enableNotifications}
                      onChange={e => setInventoryData({...inventoryData, enableNotifications: e.target.checked})}
                    />
                    <label htmlFor="notifications" className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Stock Notifications</label>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Inventory Rules</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'salary' && (
              <form onSubmit={handleUpdateSalary} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Basic Salary</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={salaryData.defaultSalesSalary}
                      onChange={e => setSalaryData({...salaryData, defaultSalesSalary: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Basic Salary</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={salaryData.defaultManagerSalary}
                      onChange={e => setSalaryData({...salaryData, defaultManagerSalary: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Helper Basic Salary</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={salaryData.defaultHelperSalary}
                      onChange={e => setSalaryData({...salaryData, defaultHelperSalary: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Salary Rules</>}
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'appearance' && (
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleAppearanceChange(mode)}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${
                        appearance === mode 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                         mode === 'light' ? 'bg-white text-orange-500 shadow-sm' : mode === 'dark' ? 'bg-slate-950 text-indigo-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {mode === 'light' ? <Palette className="w-6 h-6" /> : mode === 'dark' ? <Palette className="w-6 h-6" /> : <Palette className="w-6 h-6" />}
                      </div>
                      <span className="capitalize font-bold text-slate-900 dark:text-white">{mode} Mode</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center">Changes are saved to your browser's local storage.</p>
              </div>
            )}

            {activeSection === 'security' && (
              <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={securityData.currentPassword}
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={securityData.newPassword}
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      value={securityData.confirmPassword}
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-5 h-5" /> Change Password</>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
