import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, User, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password, role });
      login(res.data.token, res.data.user);
      
      // Check if store setup is complete by checking if categories exist
      const tokenHeader = { headers: { Authorization: `Bearer ${res.data.token}` } };
      const categoriesRes = await api.get('/api/categories', tokenHeader);
      
      if (res.data.user.role === 'admin' && categoriesRes.data.length === 0) {
        navigate('/setup');
      } else {
        navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/billing');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 text-center bg-indigo-600">
          <h1 className="text-3xl font-bold text-white">CoreBiz</h1>
          <p className="text-indigo-100 mt-2">Sign in to manage your business</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Login Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${role === 'employee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                Employee
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="admin@corebiz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : (
              <>
                <LogIn className="w-5 h-5" /> Sign In
              </>
            )}
          </button>

          <div className="pt-4 text-center space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Default Admin: admin@corebiz.com / admin123
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Don't have a store yet?</p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-indigo-600 font-bold hover:underline"
              >
                Create Your Store
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
