import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/reports/sales-trend')
        ]);
        setStats(statsRes.data);
        setTrend(trendRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const statCards = [
    { name: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    { name: 'Total Products', value: stats?.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Total Customers', value: stats?.totalCustomers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    { name: 'Total Sales', value: stats?.totalSales, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back to your business command center.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium dark:text-slate-300">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.name}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold dark:text-white mb-6">Revenue Trend (Last 30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold dark:text-white">Low Stock Alerts</h3>
            <span className="bg-red-100 dark:bg-red-900/20 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
              {stats?.lowStock.length} Items
            </span>
          </div>
          <div className="space-y-4">
            {stats?.lowStock.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.stock < 2 ? 'text-red-600' : 'text-orange-600'}`}>
                    {item.stock} left
                  </p>
                  <p className={`text-[10px] uppercase font-bold ${item.stock < 2 ? 'text-red-500' : 'text-orange-500'}`}>
                    {item.stock < 2 ? 'Critical Stock' : 'Low Stock'}
                  </p>
                </div>
              </div>
            ))}
            {stats?.lowStock.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">All stock levels are healthy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">Recent Sales</h3>
          <button className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {stats?.recentSales.map((sale: any) => (
                <tr key={sale.id} className="text-sm dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium">{sale.invoiceId}</td>
                  <td className="px-6 py-4">{sale.customerName || 'Walk-in Customer'}</td>
                  <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">₹{sale.grandTotal.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
