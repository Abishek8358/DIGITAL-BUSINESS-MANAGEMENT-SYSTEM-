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
  CheckCircle2,
  PieChart as PieIcon,
  Filter,
  RefreshCcw,
  ArrowRight
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch core stats first
      const statsRes = await api.get('/api/dashboard/stats').catch(err => {
        console.error('Stats fetch failed', err);
        return { data: null };
      });
      
      // Fetch analytics (might fail if new endpoint has issues)
      const analyticsRes = await api.get(`/api/analytics/dashboard?filter=${filter}`).catch(err => {
        console.error('Analytics fetch failed', err);
        return { data: null };
      });

      // Fetch complaints
      const complaintsRes = await api.get('/api/complaints').catch(err => {
        console.error('Complaints fetch failed', err);
        return { data: [] };
      });

      if (statsRes.data) {
        setStats({ 
          ...statsRes.data, 
          complaints: complaintsRes.data
        });
      }
      
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      } else if (!statsRes.data) {
        setError("Unable to load dashboard data. Please check your connection.");
      }

    } catch (error: any) {
      console.error('Failed to fetch dashboard data', error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  if (loading && !stats && !analytics) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Analyzing Business Data...</p>
    </div>
  );

  if (error && !stats && !analytics) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-6">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Dashboard <span className="text-red-500">Error</span></h2>
      <p className="text-slate-500 max-w-md">{error}</p>
      <button onClick={fetchData} className="mt-6 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">
        Try Again
      </button>
    </div>
  );

  const mainStats = [
    { name: 'Total Revenue', value: analytics?.summary?.total_revenue || stats?.monthlyRevenue || 0, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', isMoney: true },
    { name: 'Total Profit', value: analytics?.profit || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', isMoney: true },
    { name: 'Total Sales', value: analytics?.summary?.total_sales || stats?.totalSales || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', isMoney: false },
    { name: 'Total Customers', value: analytics?.customers?.total || stats?.totalCustomers || 0, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', isMoney: false },
  ];

  const stockStats = [
    { name: 'Total Products', value: analytics?.stock?.total_products || stats?.totalProducts || 0, icon: Package, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10' },
    { name: 'Low Stock', value: analytics?.stock?.low_stock_count || (stats?.lowStock?.length || 0), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'Out of Stock', value: analytics?.stock?.out_of_stock_count || 0, icon: Zap, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
    { name: 'Total Stock', value: analytics?.stock?.total_stock || 0, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-indigo-600 text-[10px] font-black text-white rounded-lg uppercase tracking-widest shadow-lg shadow-indigo-600/20">Pro Insights</div>
             <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            Business <span className="text-indigo-600 dark:text-indigo-400">Intelligence</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'all', label: 'All Time' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchData}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:rotate-180 duration-500"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((card) => (
          <div key={card.name} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${card.bg} opacity-20 group-hover:scale-150 transition-transform`} />
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
        {/* Sales Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[500px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase italic">Sales <span className="text-indigo-600">Performance</span></h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Revenue Trend</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Summary */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col h-[500px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                <PieIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase italic">Stock <span className="text-amber-500">Summary</span></h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 flex-1">
            {stockStats.map((s) => (
              <div key={s.name} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`${s.bg} p-3 rounded-xl`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.name}</span>
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Most Profitable */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Most <span className="text-emerald-600">Profitable</span></h3>
            <TrendingUp className="w-5 h-5 text-emerald-500 opacity-30" />
          </div>
          <div className="space-y-4">
            {analytics?.mostProfitable?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px]">{item.name}</span>
                <span className="text-xs font-black text-emerald-600">₹{Math.round(item.total_profit).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Top <span className="text-indigo-600">Selling</span></h3>
            <ShoppingBag className="w-5 h-5 text-indigo-500 opacity-30" />
          </div>
          <div className="space-y-4">
            {analytics?.topSelling?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px]">{item.name}</span>
                <span className="text-xs font-black text-indigo-600">{item.total_sold} Sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Least Selling */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Least <span className="text-amber-600">Selling</span></h3>
            <Zap className="w-5 h-5 text-amber-500 opacity-30" />
          </div>
          <div className="space-y-4">
            {analytics?.leastSelling?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px]">{item.name}</span>
                <span className="text-xs font-black text-amber-600">{item.total_sold} Sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Analysis */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase italic">Customer <span className="text-indigo-600">Insights</span></h3>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loyalty Base</p>
               <p className="text-xl font-black text-slate-900 dark:text-white">{analytics?.customers?.total || stats?.totalCustomers || 0}</p>
            </div>
          </div>
          <div className="space-y-4">
             {analytics?.customers?.frequent?.map((c: any, idx: number) => (
               <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-black text-xs">
                       {idx + 1}
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.purchase_count} Orders</span>
                     <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Revenue History (Fixed Sorting) */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[500px] flex flex-col shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase italic">Annual <span className="text-indigo-600">History</span></h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 Month Revenue View</p>
                </div>
              </div>
           </div>
           <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats?.revenueHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={35} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
