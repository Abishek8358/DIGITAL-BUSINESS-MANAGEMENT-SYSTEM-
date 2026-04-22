import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShoppingBag,
  Zap,
  Activity,
  BarChart3,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topRes, complaintsRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/reports/top-products'),
          api.get('/api/complaints')
        ]);
        setStats({ 
          ...statsRes.data, 
          topProducts: topRes.data,
          complaints: complaintsRes.data
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resolveComplaint = async (id: number) => {
    try {
      await api.put(`/api/complaints/${id}/resolve`);
      setStats({
        ...stats,
        complaints: stats.complaints.map((c: any) => c.id === id ? { ...c, status: 'resolved' } : c)
      });
    } catch (err) {
      console.error('Failed to resolve complaint', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading dashboard...</p>
    </div>
  );

  const statCards = [
    { name: 'Monthly Revenue', value: stats?.monthlyRevenue || 0, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', isMoney: true },
    { name: 'Total Profit', value: stats?.totalProfit || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', isMoney: true },
    { name: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', isMoney: false },
    { name: 'Total Sales', value: stats?.totalSales || 0, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', isMoney: false },
  ];

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            Admin <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Performance analytics for your business</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto shadow-sm">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className={`${card.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-7 h-7 ${card.color}`} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.name}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {card.isMoney ? `₹${Number(card.value).toLocaleString()}` : Number(card.value).toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[500px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue Trends</h3>
            </div>
            <select className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest px-5 py-2.5 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 transition-all">
              <option>Last 12 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueHistory || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(0,0,0,0.05)', 
                    borderRadius: '24px', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#barGradient)" 
                  radius={[12, 12, 0, 0]} 
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col h-[500px] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Alerts</h3>
            </div>
            <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-red-100 dark:border-red-500/20">
              {stats?.lowStock?.length || 0} Critical
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {stats?.lowStock?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${item.stock < 2 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                    {item.stock} left
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.lowStock || stats?.lowStock?.length === 0) && (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12 opacity-30">
                <Activity className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No stock alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Top Products</h3>
            </div>
          </div>
          <div className="space-y-4">
            {stats?.topProducts?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                    {item.total_sold} sold
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">
                No products sold yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
          <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Sales</h3>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-10 py-5">Invoice ID</th>
                  <th className="px-10 py-5">Customer</th>
                  <th className="px-10 py-5">Date</th>
                  <th className="px-10 py-5">Amount</th>
                  <th className="px-10 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.recentSales?.map((sale: any) => (
                  <tr key={sale.id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-10 py-6 font-bold text-indigo-600 dark:text-indigo-400">{sale.invoiceId}</td>
                    <td className="px-10 py-6 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{sale.customerName || 'Walking Customer'}</td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td className="px-10 py-6 font-black text-slate-900 dark:text-white">₹{sale.grandTotal.toLocaleString()}</td>
                    <td className="px-10 py-6 text-right">
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter border border-emerald-100 dark:border-emerald-500/20">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats?.recentSales || stats.recentSales.length === 0) && (
              <div className="text-center py-20 text-xs font-bold text-slate-400 uppercase tracking-widest">
                No recent sales
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Feedback Section */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-indigo-600" />
             </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Staff <span className="text-indigo-600">Feedback</span></h3>
          </div>
          <span className="bg-indigo-600 text-white text-[10px] font-black px-5 py-2 rounded-full shadow-lg shadow-indigo-600/20 uppercase tracking-widest">
            {stats?.complaints?.filter((c: any) => c.status === 'pending').length || 0} Pending
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats?.complaints?.map((c: any) => (
            <div key={c.id} className={`p-8 rounded-[2.5rem] border transition-all ${c.status === 'resolved' ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/40 shadow-sm hover:border-indigo-300'}`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-inner">
                    {c.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.employeeName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.employeeRole}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${c.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 italic leading-relaxed font-medium">"{c.message}"</p>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                {c.status === 'pending' && (
                  <button 
                    onClick={() => resolveComplaint(c.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 active:scale-95 transition-all uppercase tracking-[0.1em]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!stats?.complaints || stats.complaints.length === 0) && (
            <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No feedback received</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
