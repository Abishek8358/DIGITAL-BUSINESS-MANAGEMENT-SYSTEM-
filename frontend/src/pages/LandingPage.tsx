import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight,
  Globe,
  Layout,
  BarChart3,
  Database,
  PieChart as PieChartIcon,
  Activity,
  Briefcase,
  Layers,
  Fingerprint,
  Cpu,
  Monitor,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const features = [
    { name: 'Product Management', desc: 'Organize your inventory with categories, brands, and variants.', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { name: 'Stock Alerts', desc: 'Get real-time alerts when stock is low and manage reorders easily.', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'Fast Billing', desc: 'Generate professional GST invoices and bills in seconds.', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { name: 'Customer Management', desc: 'Maintain detailed records of customer purchases and contact info.', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { name: 'Business Reports', desc: 'Get clear insights into your sales, profits, and top products.', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { name: 'Employee Management', desc: 'Manage staff access and roles with secure, role-based controls.', icon: Shield, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden antialiased transition-colors duration-300">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Core<span className="text-indigo-600 dark:text-indigo-400">Biz</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Testimonials', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">{item}</a>
            ))}
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-8 ml-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest px-4"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CheckCircle2 className="w-4 h-4" /> Trusted by 1,200+ Businesses Globally
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Scale Your <br />
            <span className="text-indigo-600 dark:text-indigo-400">Business.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-900">
            The simplest and most powerful way to manage your store, inventory, and billing. Enjoy real-time insights and professional GST invoices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
            >
              Member Login
            </button>
          </div>

          <div className="mt-28 w-full max-w-6xl mx-auto p-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-1000">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800">
                <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80" 
                    alt="CoreBiz Dashboard" 
                    className="w-full h-auto opacity-90 object-cover"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Powerful Features to Grow Faster.</h2>
             <p className="text-slate-500 font-medium">Built with the modern business owner in mind, CoreBiz provides tools that make management effortless.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all group">
                <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{feature.name}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-32 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
                { label: 'Stores Registered', value: '1,200+' },
                { label: 'Uptime Guarantee', value: '99.99%' },
                { label: 'Transactions Done', value: '₹50Cr+' },
                { label: 'Customer Support', value: '24/7' }
            ].map((stat) => (
                <div key={stat.label} className="text-center group">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Core<span className="text-indigo-600 dark:text-indigo-400">Biz</span></span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Empowering Small Businesses Since 2026</p>
              <div className="flex gap-8">
                {['Terms', 'Privacy', 'Support', 'Legal'].map((item) => (
                    <a key={item} href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">{item}</a>
                ))}
              </div>
          </div>
        </div>
        <div className="text-center mt-16 text-[10px] font-bold text-slate-300 dark:text-slate-800 uppercase tracking-widest">© 2026 CoreBiz SaaS. All rights reserved.</div>
      </footer>
    </div>
  );
}
