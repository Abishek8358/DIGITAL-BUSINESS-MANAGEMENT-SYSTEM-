import React, { useState, useEffect } from 'react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Download, Filter, Calendar, TrendingUp, DollarSign, PieChart as PieIcon, Package, ShoppingBag, BarChart3, Loader2, Zap, Activity, Globe, Cpu } from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>({
    total_revenue: 0, total_orders: 0, average_order_value: 0, gst_collected: 0, total_profit: 0
  });
  const [yearlyRevenue, setYearlyRevenue] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, yearlyRes, distRes, topRes] = await Promise.all([
        api.get('/api/reports/summary'),
        api.get('/api/reports/yearly-revenue'),
        api.get('/api/reports/category-distribution'),
        api.get('/api/reports/top-products')
      ]);
      setSummary(summaryRes.data);
      setYearlyRevenue(yearlyRes.data);
      setCategoryDist(distRes.data);
      setTopProducts(topRes.data);
    } catch (error) {
      console.error('Failed to fetch reports data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`CoreBiz_Report_${date}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      alert('Failed to export PDF');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading reports...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Analytics & Insights
            </h1>
            <p className="text-slate-500 font-medium">
                View detailed reports of your store performance.
            </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Refresh
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-12">
        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', val: `₹${parseFloat(summary.total_revenue).toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Profit', val: `₹${parseFloat(summary.total_profit).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Orders', val: summary.total_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'GST Collected', val: `₹${parseFloat(summary.gst_collected).toLocaleString()}`, icon: Filter, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative group overflow-hidden shadow-sm">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.val}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Yearly Chart */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue History</h3>
                <Activity className="w-5 h-5 text-indigo-500 opacity-20" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={yearlyRevenue}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={30}>
                    {yearlyRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#4f46e5" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Revenue Chart */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Category Revenue</h3>
                <PieIcon className="w-5 h-5 text-emerald-500 opacity-20" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={categoryDist} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" fillOpacity={0.8} radius={[0, 6, 6, 0]} barSize={20} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Row */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Top Products Performance</h3>
                <Zap className="w-6 h-6 text-amber-500 opacity-40" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={topProducts}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total_sold" radius={[8, 8, 0, 0]} barSize={60}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f59e0b" fillOpacity={0.8} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pt-8">
          <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 opacity-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">CoreBiz SaaS Reports System</span>
          </div>
      </div>
    </div>
  );
}
