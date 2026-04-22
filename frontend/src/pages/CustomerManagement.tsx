import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Calendar, ShoppingBag, ExternalLink, Loader2, X, FileText, Package, Globe, Activity, Zap, Cpu, History } from 'lucide-react';
import api from '../services/api';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/customers/${customer.id}/history`);
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search)) ||
    (c.mobile && c.mobile.includes(search))
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading customers...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Customers
            </h1>
            <p className="text-slate-500 font-medium">
                View and manage your store's customer base and their purchase history.
            </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <Users className="w-5 h-5 text-indigo-500" />
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Customers</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{customers.length}</span>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or mobile number..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-10 py-6">Customer Name</th>
                <th className="px-10 py-6">Mobile Number</th>
                <th className="px-10 py-6">Total Spent</th>
                <th className="px-10 py-6">Last Visit</th>
                <th className="px-10 py-6 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center font-bold">
                        {customer.name[0]}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                      <Phone className="w-4 h-4 text-slate-400" /> {customer.phone || customer.mobile || 'N/A'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">₹{parseFloat(customer.total_spent || customer.totalPurchases || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <Calendar className="w-4 h-4 text-slate-400" /> 
                      {customer.last_visit || customer.lastPurchaseDate ? new Date(customer.last_visit || customer.lastPurchaseDate).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => fetchHistory(customer)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-2 ml-auto group/btn transition-all"
                    >
                      View History <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 font-medium">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Purchase History</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">{selectedCustomer.name} // {selectedCustomer.phone || selectedCustomer.mobile}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-slate-500">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                  No purchases found for this customer.
                </div>
              ) : (
                history.map((sale: any) => (
                  <div key={sale.id} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{sale.invoiceId}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{new Date(sale.date).toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {sale.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-medium">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Package className="w-3.5 h-3.5" />
                            <span>{item.productName} <span className="text-slate-400">x</span> {item.quantity}</span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">₹{parseFloat(item.total).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">₹{parseFloat(sale.grandTotal || sale.total).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
