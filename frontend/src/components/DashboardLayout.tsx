import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Tags,
  TrendingUp,
  Store,
  AlertTriangle,
  MessageSquare,
  LifeBuoy,
  Layout,
  Globe,
  Activity,
  Zap
} from 'lucide-react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const API_BASE = 'http://localhost:5000';

function resolveLogoUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState<{ storeName?: string; logoUrl?: string }>({});
  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    api.get('/api/store').then(res => {
      setStoreInfo(res.data);
    }).catch(() => { });

    if (['admin', 'owner'].includes(user?.role || '')) {
      api.get('/api/complaints').then(res => {
        const pending = (res.data as any[]).filter(c => c.status === 'pending').length;
        setComplaintCount(pending);
      }).catch(() => { });
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', isAdmin: false },
    { name: 'Generate Bill', icon: ShoppingCart, path: '/billing', isAdmin: false },
    { name: 'Products', icon: Package, path: '/admin/products', isAdmin: false },
    { name: 'Categories', icon: Tags, path: '/admin/categories', isAdmin: true },
    { name: 'Customers', icon: Users, path: '/admin/customers', isAdmin: false },
    { name: 'Inventory', icon: AlertTriangle, path: '/admin/inventory', isAdmin: false },
    { name: 'Employees', icon: UserCircle, path: '/admin/employees', isAdmin: true },
    { name: 'Reports', icon: TrendingUp, path: '/admin/reports', isAdmin: true },
    { name: 'Staff Feedback', icon: MessageSquare, path: '/admin/complaints', isAdmin: true, badge: complaintCount },
    { name: 'Settings', icon: Settings, path: '/admin/settings', isAdmin: true },
    { name: 'Help & Feedback', icon: LifeBuoy, path: '/admin/raise-complaint', isAdmin: false, hideOnAdmin: true },
  ];

  const filteredMenu = menuItems.filter(item => {
    const isAdminUser = ['admin', 'owner'].includes(user?.role || '');
    if (item.isAdmin) return isAdminUser;
    if (item.hideOnAdmin && isAdminUser) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden relative transition-colors duration-300">

      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse font-medium" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-600/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 overflow-hidden">
                {storeInfo.logoUrl ? (
                  <img src={resolveLogoUrl(storeInfo.logoUrl)} alt="Logo" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden')); }} />
                ) : null}
                <Store className={`w-5 h-5 text-white fallback-icon ${storeInfo.logoUrl ? 'hidden' : ''}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {storeInfo.storeName || 'CoreBiz'}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SaaS System</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto no-scrollbar">
            <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Main Menu</div>
            {filteredMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                `}
              >
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold flex-1 tracking-tight">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-6 mt-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold uppercase shadow-inner">
                {user?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-red-200 uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Menu className="w-6 h-6" />
            </button>

          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 transition-all hover:text-indigo-600 shadow-sm"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block mx-2" />

            <div className="flex items-center gap-2.5 bg-indigo-600 px-5 py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hidden md:flex shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
              <Zap className="w-4 h-4" /> Billing Online
            </div>
          </div>
        </header>

        {/* Dash/Pages */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
