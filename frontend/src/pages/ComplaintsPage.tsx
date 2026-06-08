import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  User, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Fingerprint,
  Monitor,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/api/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id: number) => {
    if (!window.confirm('Mark this complaint as resolved?')) return;
    setResolving(id);
    try {
      await api.put(`/api/complaints/${id}/resolve`);
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    } finally {
      setResolving(null);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading complaints...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-10">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Complaints & Feedback
            </h1>
            <p className="text-slate-500 font-medium">
                Review and resolve feedback or complaints submitted by your employees.
            </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-500/20 shadow-sm flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <AlertCircle className="w-5 h-5 animate-pulse shrink-0" />
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-amber-700 dark:text-amber-500">Needs Attention</span>
                <span className="text-base sm:text-lg font-bold tracking-tight mt-1">{pendingCount} Pending</span>
            </div>
          </div>
        )}
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-20 sm:py-40 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="grid place-items-center mb-6">
              <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 dark:text-slate-800" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">No Complaints</h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500">Your employees haven't submitted any feedback yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {complaints.map(complaint => (
            <div 
              key={complaint.id} 
              className={`bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border transition-all duration-300 relative group shadow-sm ${
                complaint.status === 'pending' 
                  ? 'border-indigo-200 dark:border-indigo-900/40 hover:shadow-xl' 
                  : 'border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:items-center">
                <div className="flex-1 space-y-4 sm:space-y-6">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">{complaint.employeeName}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Role: {complaint.role || complaint.employeeRole}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Submitted: {new Date(complaint.createdAt || complaint.created_at).toLocaleString()}
                      </span>
                    </div>
                    {complaint.status === 'resolved' ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-emerald-100">
                        Resolved
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="relative pl-4 sm:pl-6 border-l-4 border-indigo-100 dark:border-indigo-900/40">
                    <p className="text-sm sm:text-base lg:text-lg text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                      "{complaint.message}"
                    </p>
                  </div>
                </div>

                {complaint.status === 'pending' && (
                  <button 
                    onClick={() => handleResolve(complaint.id)}
                    disabled={resolving === complaint.id}
                    className="w-full lg:w-auto justify-center flex-shrink-0 flex items-center gap-2 px-6 py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase tracking-widest font-bold shadow-lg shadow-indigo-600/20 rounded-xl sm:rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {resolving === complaint.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group shadow-sm">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 flex-shrink-0">
           <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 space-y-1 sm:space-y-2 text-center sm:text-left">
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Employee Communication</h4>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
            Employees can submit feedback from their dashboard. Resolving these feedback or complaints promptly helps maintain a healthy and productive work environment.
          </p>
        </div>
        <div className="ml-0 sm:ml-auto opacity-20 hidden md:block">
            <Zap className="w-10 h-10 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
