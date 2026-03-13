import React, { useState, useEffect } from 'react';
import { UserCircle, Plus, Mail, Phone, Shield, MoreVertical, ShieldCheck, ShieldAlert, DollarSign, Calendar, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', salary: '', joinDate: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/employees', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', salary: '', joinDate: new Date().toISOString().split('T')[0] });
      fetchEmployees();
    } catch (error) {
      alert('Failed to add employee');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Employee Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage staff accounts and permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                {emp.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold dark:text-white">{emp.name}</h3>
                <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4" /> {emp.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4" /> Role: <span className="capitalize">{emp.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <DollarSign className="w-4 h-4" /> Salary: ₹{parseFloat(emp.salary).toLocaleString()}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <Calendar className="w-4 h-4" /> Joined: {new Date(emp.joinDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button className="flex-1 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-xl transition-colors">
                Edit Profile
              </button>
              <button className="flex-1 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-white">Add New Employee</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input 
                  type="email" required
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input 
                  type="password" required
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="helper">Helper</option>
                    <option value="employee">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Base Salary</label>
                  <input 
                    type="number"
                    placeholder="Leave blank for default"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Join Date</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                  value={formData.joinDate}
                  onChange={e => setFormData({...formData, joinDate: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
