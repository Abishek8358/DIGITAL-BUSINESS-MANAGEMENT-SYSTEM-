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
  CheckCircle2,
  Globe,
  Layout,
  BarChart3,
  Database,
  PieChart as PieChartIcon
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { name: 'Product Management', desc: 'Organize products with categories, brands, and dynamic pricing.', icon: Package, color: 'text-cyan-500' },
    { name: 'Inventory Tracking', desc: 'Real-time stock monitoring with low-stock alerts and reorder system.', icon: Zap, color: 'text-amber-500' },
    { name: 'Billing & POS', desc: 'Fast, intuitive billing interface with instant invoice generation.', icon: ShoppingCart, color: 'text-emerald-500' },
    { name: 'Customer Management', desc: 'Track customer purchase history and build loyalty.', icon: Users, color: 'text-indigo-400' },
    { name: 'Sales Analytics', desc: 'Deep insights into revenue, top products, and profit trends.', icon: TrendingUp, color: 'text-rose-500' },
    { name: 'Role-Based Access', desc: 'Secure environment with separate Admin and Employee permissions.', icon: Shield, color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/10 blur-[100px] rounded-full animate-pulse-slow shadow-[0_0_50px_rgba(6,182,212,0.1)]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-emerald-600/5 blur-[80px] rounded-full animate-pulse-slow" style={{ animationDelay: '4s' }} />
        
        {/* Floating Icons Background */}
        <div className="absolute top-20 left-[10%] opacity-10 animate-float">
          <BarChart3 className="w-16 h-16 text-cyan-500" />
        </div>
        <div className="absolute bottom-40 left-[15%] opacity-5 animate-float" style={{ animationDelay: '1s' }}>
          <Database className="w-20 h-20 text-indigo-500" />
        </div>
        <div className="absolute top-60 right-[15%] opacity-10 animate-float" style={{ animationDelay: '2s' }}>
          <PieChartIcon className="w-14 h-14 text-emerald-500" />
        </div>
        <div className="absolute bottom-20 right-[20%] opacity-5 animate-float" style={{ animationDelay: '3s' }}>
          <ShoppingCart className="w-24 h-24 text-amber-500" />
        </div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">CoreBiz<span className="text-cyan-500">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors">Home</a>
            <a href="#features" className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#about" className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors">About</a>
            <div className="flex items-center gap-4 border-l border-slate-800 pl-8 ml-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Globe className="w-4 h-4 animate-pulse" /> 🚀 Next-Gen Business Intelligence
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            Master Your Business <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent text-glow-cyan">with Full Precision.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            CoreBiz brings enterprise-grade management tools to your fingertips. 
            Real-time analytics, inventory mastery, and seamless checkout — all powered by a premium UX.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-5 rounded-2xl text-lg font-black hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto glass-dark text-white border border-slate-700 px-10 py-5 rounded-2xl text-lg font-black hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              System Login
            </button>
          </div>

          <div className="mt-24 relative p-4 group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-1000" />
            <div className="relative rounded-[2rem] p-2 bg-slate-900/50 border border-slate-800 backdrop-blur-sm shadow-2xl overflow-hidden">
              <img 
                src="/assets/hero-dashboard.png" 
                alt="Dashboard Preview" 
                className="rounded-2xl w-full max-w-5xl mx-auto shadow-2xl group-hover:scale-[1.01] transition-transform duration-700"
              />
            </div>
            {/* Floating stats badge */}
            <div className="absolute top-[20%] -right-4 hidden lg:block glass p-4 rounded-2xl animate-float border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500">Live Revenue</p>
                  <p className="text-lg font-black text-white">$1.8M <span className="text-emerald-500 text-xs">+12%</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Built for High Performance.</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-cyan-500 mx-auto rounded-full" />
            <p className="text-slate-400 mt-8 text-lg max-w-xl mx-auto font-medium">Everything you need to command your business empire, packed into a high-tech interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="glass-dark p-8 rounded-[2.5rem] border-slate-800/40 hover:border-cyan-500/30 transition-all hover:-translate-y-2 group">
                <div className={`w-16 h-16 bg-slate-800/50 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{feature.name}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Section / Trust Bar */}
      <section className="relative z-10 py-20 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div>
              <p className="text-4xl font-black text-white">500+</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Enterprises</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">99.9%</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Uptime</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">₹24Cr+</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Processed</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">24/7</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">Expert Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">CoreBiz<span className="text-cyan-500">.</span></span>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-tight">© 2026 CoreBiz Systems. Empowering global commerce.</p>
          <div className="flex gap-10">
            <a href="#" className="text-sm font-black text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-sm font-black text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest">Terms</a>
            <a href="#" className="text-sm font-black text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
