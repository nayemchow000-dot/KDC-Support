import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Info,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, setClientScreen, device, customerDetails } = useSupport();

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [emailInput, setEmailInput] = useState(customerDetails.customerEmail || 'nayemchow000@gmail.com');
  const [phoneInput, setPhoneInput] = useState(customerDetails.customerPhone || '+880 1712-345678');
  const [password, setPassword] = useState('dawah2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const identifier = authMethod === 'email' ? emailInput : phoneInput;
    if (!identifier.trim()) {
      setErrorMsg(`Please provide a valid ${authMethod === 'email' ? 'email address' : 'phone number'}.`);
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const success = login(identifier, password, authMethod, rememberDevice);
      if (!success) {
        setErrorMsg('Authentication failed. Please verify your credentials.');
      }
    }, 350);
  };

  const handleQuickFill = (type: 'phone' | 'email') => {
    setErrorMsg(null);
    if (type === 'phone') {
      setAuthMethod('phone');
      setPhoneInput('+880 1712-345678');
      setPassword('dawah2026!');
    } else {
      setAuthMethod('email');
      setEmailInput('nayemchow000@gmail.com');
      setPassword('dawah2026!');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-white p-5 sm:p-7 justify-between relative">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setClientScreen('permissions')}
            className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Permissions
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{device.deviceModel.split('(')[0].trim()}</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Device Authentication
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to pair this device with the authorized KDC Support dashboard.
          </p>
        </div>

        {/* Option Tabs: Email vs Phone */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'email'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'phone'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone Number</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method 1: Email */}
          {authMethod === 'email' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>
          ) : (
            /* Method 2: Phone */
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mobile Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember this device checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="rememberDevice"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="rememberDevice" className="text-xs text-slate-300 cursor-pointer">
              Remember this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Login & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick-Fill Bar */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span>Quick-fill test accounts:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('phone')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 font-medium"
            >
              Phone: +880 1712-345678
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('email')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
            >
              nayemchow000@gmail.com
            </button>
          </div>
        </div>
      </div>

      {/* Security Footer Notice */}
      <div className="mt-6 pt-3 border-t border-slate-800/60 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Encrypted token transmission. Passwords are never stored as plain text.</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Reset Password</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Enter your registered {authMethod} to receive an official recovery link or temporary
              SMS code.
            </p>

            {forgotSubmitted ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-xs mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reset instructions dispatched successfully.</span>
              </div>
            ) : (
              <input
                type="text"
                defaultValue={authMethod === 'email' ? emailInput : phoneInput}
                placeholder="Enter email or phone"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white mb-4 focus:outline-none focus:border-cyan-500"
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setForgotSubmitted(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              {!forgotSubmitted ? (
                <button
                  type="button"
                  onClick={() => setForgotSubmitted(true)}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Send Link
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
