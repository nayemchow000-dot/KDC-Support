import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import { ShieldAlert, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Smartphone } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';

export const AdminAuthGate: React.FC = () => {
  const {
    isAdminUser,
    loginAdmin,
    loginAdminWithGoogle,
    setCurrentView,
  } = useSupport();

  const [emailInput, setEmailInput] = useState('nayemchow000@gmail.com');
  const [passwordInput, setPasswordInput] = useState('dawah2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already authenticated with admin role, render the dashboard directly
  if (isAdminUser) {
    return <AdminDashboard />;
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await loginAdminWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed. Please select your authorized admin account.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const success = await loginAdmin(emailInput.trim(), passwordInput);
      if (!success) {
        setAuthError('Access Denied: The provided account does not have administrator authorization.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-64px)] bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/10">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800/80 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Administrator Access Only</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            KDC Support Admin Portal
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role-Based Access Control (RBAC) is enforced. Access to the fleet database is restricted to authorized technicians.
          </p>
        </div>

        {authError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{authError}</div>
          </div>
        )}

        {/* Primary Recommended: One-Click Google Sign-in */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <span>Authenticating with Google...</span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign In with Google (nayemchow000@gmail.com)</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-center text-slate-400 mt-1.5">
            Default authenticated provider configured for this project
          </div>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider shrink-0">
            or use credentials
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@kdcsupport.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying Admin Permissions...</span>
            ) : (
              <>
                <span>Sign In with Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Designated Admin Account:</span>
            <span className="font-mono text-[10px] text-cyan-400">Bootstrap Role</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmailInput('nayemchow000@gmail.com');
              setPasswordInput('dawah2026!');
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 font-mono text-[11px] text-left truncate transition-colors"
          >
            nayemchow000@gmail.com (Click to load)
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setCurrentView('client')}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Switch to Customer App</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400">Supabase RLS</span>
        </div>
      </div>
    </div>
  );
};
