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
  Layout
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { name: 'Product Management', desc: 'Organize products with categories, brands, and dynamic pricing.', icon: Package },
    { name: 'Inventory Tracking', desc: 'Real-time stock monitoring with low-stock alerts and reorder system.', icon: Zap },
    { name: 'Billing & POS', desc: 'Fast, intuitive billing interface with instant invoice generation.', icon: ShoppingCart },
    { name: 'Customer Management', desc: 'Track customer purchase history and build loyalty.', icon: Users },
    { name: 'Sales Analytics', desc: 'Deep insights into revenue, top products, and profit trends.', icon: TrendingUp },
    { name: 'Role-Based Access', desc: 'Secure environment with separate Admin and Employee permissions.', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">CoreBiz</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">About</a>
            <button 
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-bold mb-8">
            <Globe className="w-4 h-4" /> Trusted by 500+ small businesses
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
            Smart Business Management <br />
            <span className="text-indigo-600">for Small Shops.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            CoreBiz helps you manage products, track inventory, handle billing, and analyze sales — all in one powerful, easy-to-use platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Watch Demo
            </button>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-indigo-600/20 blur-[120px] rounded-full" />
            <img 
              src="https://picsum.photos/seed/dashboard/1200/600" 
              alt="Dashboard Preview" 
              className="relative rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to grow.</h2>
            <p className="text-slate-600 dark:text-slate-400">Powerful features designed specifically for small shop owners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">CoreBiz</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">© 2026 CoreBiz Management Systems. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
