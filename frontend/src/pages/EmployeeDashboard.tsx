import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Clock, Zap, Activity, Monitor, Fingerprint, ShieldCheck, MessageSquare, Send, Loader2, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/employee/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/complaints', { message: complaintText });
      setMessage({ text: 'Feedback submitted successfully', type: 'success' });
      setComplaintText('');
      setTimeout(() => {
        setIsComplaintModalOpen(false);
        setMessage({ text: '', type: '' });
      }, 2000);
    } catch (error) {
      setMessage({ text: 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading dashboard...</p>
    </div>
  );

  const statCards = [
    { name: "Today's Sales", value: stats?.todaySalesCount || 0, icon: ShoppingBag, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { name: "Today's Revenue", value: `₹${(stats?.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user?.name}.</span>
            </h1>
            <p className="text-slate-500 font-medium">
                Dashboard for {new Date().toLocaleDateString()}
            </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Clock className="w-5 h-5 text-indigo-500" />
          <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Time</span>
               <span className="text-lg font-bold text-slate-900 dark:text-white">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-8 group hover:-translate-y-1 transition-all">
            <div className={`${card.bg} w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner`}>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{card.name}</p>
              <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
           <div>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Sales</h3>
             <p className="text-sm text-slate-500 mt-1">A list of your most recent transactions.</p>
           </div>
           <TrendingUp className="w-8 h-8 text-indigo-500/20" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-10 py-5">Invoice ID</th>
                <th className="px-10 py-5">Customer</th>
                <th className="px-10 py-5">Date</th>
                <th className="px-10 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.recentSales?.map((sale: any) => (
                <tr key={sale.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-10 py-5">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{sale.invoiceId}</span>
                  </td>
                  <td className="px-10 py-5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {sale.customerName || 'Walking Customer'}
                    </span>
                  </td>
                  <td className="px-10 py-5">
                    <span className="text-xs text-slate-500">
                        {new Date(sale.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">₹{sale.grandTotal.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentSales || stats.recentSales.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-500 font-medium">
                    No sales found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action / Complaint Section */}
      <div className="bg-indigo-600 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-600/20">
          <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Feedback & Support</h3>
                  <p className="text-indigo-100 text-sm">Have an issue or suggestion? Submit a note to the admin.</p>
              </div>
          </div>
          <button 
            onClick={() => setIsComplaintModalOpen(true)}
            className="w-full md:w-auto px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors shadow-lg"
          >
              Submit Complaint
          </button>
      </div>

      {/* Complaint Modal */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-8 pb-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submit Feedback</h3>
                <button onClick={() => setIsComplaintModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <form onSubmit={handleSubmitComplaint} className="p-8 space-y-6">
                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                    <textarea 
                        rows={4}
                        required
                        className="w-full p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                        placeholder="Describe your issue or suggestion..."
                        value={complaintText}
                        onChange={e => setComplaintText(e.target.value)}
                    />
                </div>
                <button 
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Note</>}
                </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="flex justify-center pt-10">
          <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 opacity-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">CoreBiz SaaS System</span>
          </div>
      </div>
    </div>
  );
}
