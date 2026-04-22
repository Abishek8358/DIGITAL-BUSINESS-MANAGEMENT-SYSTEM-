import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, User, Lock, ArrowLeft, Eye, EyeOff, Layout, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password, role });
      login(res.data.token, res.data.user);
      
      const tokenHeader = { headers: { Authorization: `Bearer ${res.data.token}` } };
      const categoriesRes = await api.get('/api/categories', tokenHeader);
      
      const isAdmin = ['admin', 'owner'].includes(res.data.user.role);
      
      if (isAdmin && categoriesRes.data.length === 0) {
        navigate('/setup');
      } else {
        navigate(isAdmin ? '/admin/dashboard' : '/billing');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      
      {/* Back Link */}
      <button 
        onClick={() => navigate('/')}
        className="mb-10 flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        
        {/* Header Visual */}
        <div className="p-10 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <Layout className="w-7 h-7" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Core<span className="text-indigo-600 dark:text-indigo-400">Biz</span></span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Sign in to manage your store and inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-6 space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-in shake duration-300">
               <ShieldCheck className="w-5 h-5 opacity-50" /> {error}
            </div>
          )}

          {/* Role Switcher */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Select Role</label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${role === 'employee' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Employee
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-950/30 transition-colors">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                    type="email" required
                    className="w-full pl-16 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-bold text-sm outline-none transition-all shadow-inner"
                    placeholder="name@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-950/30 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                    type={showPassword ? "text" : "password"} required
                    className="w-full pl-16 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-bold text-sm outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <LogIn className="w-5 h-5" /> Login to Dashboard
              </>
            )}
          </button>

          <div className="pt-8 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Need to manage your business?</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-black hover:text-indigo-700 dark:hover:text-indigo-300 transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              Create an Account <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
