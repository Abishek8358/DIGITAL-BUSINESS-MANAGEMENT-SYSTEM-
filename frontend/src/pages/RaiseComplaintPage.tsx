import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Loader2, Zap, MessageSquare, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function RaiseComplaintPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/api/complaints', { message: message.trim() });
      setSuccess(true);
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Raise a Complaint</h1>
            <p className="text-slate-500 font-medium max-w-sm">
                Submit your feedback or complaints directly to the administrator.
            </p>
        </div>
      </div>

      {success ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden border border-emerald-100 dark:border-emerald-900 shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Complaint Submitted</h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Your complaint has been successfully sent to the administrator. They will review and resolve it soon.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg"
          >
            Submit Another Complaint
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5" /> Error: {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Message</label>
            <textarea
              required
              rows={8}
              className="w-full p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-medium text-lg placeholder:text-slate-400 transition-all outline-none shadow-inner"
              placeholder="Describe the issue or provide your feedback here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      )}

      {/* Advisory Note */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-6 rounded-2xl flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-relaxed">
          Note: Your name and role will be visible to the administrator. This helps them identify the context and resolve the issue effectively.
        </p>
      </div>
    </div>
  );
}
