import React, { useState, useEffect } from 'react';
import { UserCircle, Plus, Mail, Phone, Shield, MoreVertical, ShieldCheck, ShieldAlert, DollarSign, Calendar, Loader2, X, Trash2, UserMinus, Zap, Globe, Activity, Fingerprint, User, Lock } from 'lucide-react';
import api from '../services/api';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'employee', salary: '', status: 'active', phone: '',
    joinDate: new Date().toISOString().split('T')[0] 
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleOpenModal = (employee: any = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        password: '', 
        role: employee.role,
        salary: employee.salary.toString(),
        status: employee.status,
        phone: employee.phone || '',
        joinDate: new Date(employee.joinDate).toISOString().split('T')[0]
      });
    } else {
      setEditingEmployee(null);
      setFormData({ 
        name: '', email: '', password: '', role: 'employee', salary: '', status: 'active', phone: '',
        joinDate: new Date().toISOString().split('T')[0] 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingEmployee) {
        await api.put(`/api/employees/${editingEmployee.id}`, formData);
      } else {
        await api.post('/api/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      alert('Failed to save employee');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this employee? They will no longer be able to log in.')) {
      try {
        await api.put(`/api/employees/${id}`, { status: 'inactive' });
        fetchEmployees();
      } catch (error) {
        alert('Failed to deactivate employee');
      }
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await api.put(`/api/employees/${id}`, { status: 'active' });
      fetchEmployees();
    } catch (error) {
      alert('Failed to reactivate employee');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading employees...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Employee Management
            </h1>
            <p className="text-slate-500 font-medium">
                Manage your staff, their roles, and system access.
            </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map(emp => (
          <div key={emp.id} className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden shadow-sm ${
            emp.status === 'inactive' ? 'opacity-60 grayscale' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow-xl'
          }`}>
            <div className="flex items-center gap-6 mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border transition-all ${
                emp.status === 'active' 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {emp.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border mt-2 ${
                  emp.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {emp.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Mail className="w-4 h-4" /> {emp.email}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Phone className="w-4 h-4" /> {emp.phone || 'No phone'}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Shield className="w-4 h-4" /> Role: <span className="text-indigo-600 dark:text-indigo-400 font-bold capitalize">{emp.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <DollarSign className="w-4 h-4" /> Salary: <span className="text-slate-900 dark:text-white font-bold">₹{parseFloat(emp.salary).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 pt-2 uppercase tracking-widest">
                <Calendar className="w-4 h-4" /> Joined: {new Date(emp.joinDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => handleOpenModal(emp)}
                className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                Edit Profile
              </button>
              {emp.status === 'active' ? (
                <button 
                  onClick={() => handleDeactivate(emp.id)}
                  className="px-4 py-3 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all shadow-sm"
                  title="Deactivate"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => handleReactivate(emp.id)} 
                  className="px-4 py-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 transition-all shadow-sm"
                  title="Activate"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-full py-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center text-slate-400">
             <UserCircle className="w-16 h-16 mb-4 opacity-20" />
             <p className="font-bold uppercase tracking-widest">No employees found.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Configure user permissions and baseline information</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                    type="text" required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="Enter employee name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-semibold text-sm outline-none shadow-sm"
                        placeholder="name@domain.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-sm"
                        placeholder="000-000-0000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                  </div>
                </div>
              </div>
              {!editingEmployee && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-sm appearance-none"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="sales">Sales</option>
                        <option value="manager">Manager</option>
                        <option value="helper">Helper</option>
                        <option value="employee">Employee</option>
                      </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Monthly Salary</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">₹</span>
                      <input 
                        type="number"
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none shadow-sm"
                        placeholder="0"
                        value={formData.salary}
                        onChange={e => setFormData({...formData, salary: e.target.value})}
                      />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
