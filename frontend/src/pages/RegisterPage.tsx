import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, Store, Phone, ArrowLeft, Loader2, Layout, ShieldCheck, UserCheck, Smartphone } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create Store Account</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Start managing your business with the most powerful SaaS platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-6 space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-in shake duration-300">
               <ShieldCheck className="w-5 h-5 opacity-50" /> {error}
            </div>
          )}

          <div className="space-y-6">
            {[
              { label: 'Store Name', name: 'storeName', type: 'text', icon: Store, placeholder: 'e.g. Acme Retailers' },
              { label: 'Owner Name', name: 'name', type: 'text', icon: UserCheck, placeholder: 'John Doe' },
              { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'name@store.com' },
              { label: 'Mobile Number', name: 'phone', type: 'tel', icon: Smartphone, placeholder: '9876543210' },
              { label: 'Password', name: 'password', type: 'password', icon: Lock, placeholder: '••••••••' },
            ].map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">{field.label}</label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg group-focus-within:bg-indigo-50 dark:group-focus-within:bg-indigo-950/30 transition-colors">
                        <field.icon className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                        name={field.name}
                        type={field.type}
                        required
                        className="w-full pl-16 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-bold text-sm outline-none transition-all shadow-inner"
                        placeholder={field.placeholder}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                    />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <UserPlus className="w-5 h-5" /> Create Account & Proceed
              </>
            )}
          </button>

          <div className="pt-8 text-center border-t border-slate-100 dark:border-slate-800 mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Already managing a store?</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-black hover:text-indigo-700 dark:hover:text-indigo-300 transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              Sign In to Your Store <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
