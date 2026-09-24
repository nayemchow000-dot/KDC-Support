import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  EyeOff,
  Radio,
  FileText,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Smartphone,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setClientScreen, customerDetails, submitCustomerDetails, device } = useSupport();

  const [name, setName] = useState(customerDetails.customerName || 'Nayem Chowdhury');
  const [phone, setPhone] = useState(customerDetails.customerPhone || '+880 1712-345678');
  const [email, setEmail] = useState(customerDetails.customerEmail || 'nayemchow000@gmail.com');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await submitCustomerDetails({
      customerName: name.trim() || 'Mobile Customer',
      customerPhone: phone.trim() || '+880 1700-000000',
      customerEmail: email.trim(),
      customerNotes: 'Live Mobile Testing Flow Connected',
    });
    setIsSubmitting(false);
    setClientScreen('permissions');
  };

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white p-5 sm:p-7 justify-between">
      {/* Top Disclaimer Badge */}
      <div className="w-full flex justify-between items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] font-medium tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Official Android Remote Support Platform</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>{device.deviceModel.split('(')[0].trim()}</span>
        </div>
      </div>

      {/* Main Presentation & Form */}
      <div className="flex flex-col items-center text-center my-auto py-4 max-w-md mx-auto w-full">
        {/* Modern KDC Support Emblem */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-2xl shadow-cyan-500/20 ring-1 ring-white/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 backdrop-blur rounded-[22px] flex flex-col items-center justify-center p-2">
              <ShieldCheck className="w-10 h-10 text-cyan-400 mb-1" />
              <div className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-slate-300 font-bold uppercase">
                <Radio className="w-2.5 h-2.5 text-cyan-400 animate-ping" />
                <span>KDC SECURE</span>
              </div>
            </div>
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          KDC Support
        </h1>

        {/* Required Short Description */}
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
          KDC Support helps you connect your device with an authorized support dashboard.
        </p>

        {/* Customer Identification Inputs */}
        <form onSubmit={handleContinue} className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left shadow-lg backdrop-blur-sm mb-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <User className="w-3.5 h-3.5" />
              <span>Customer Identification</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Mobile Testing</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Customer Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nayem Chowdhury"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Customer Phone Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1712-345678"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nayemchow000@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Zero-Trust Notice */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 text-left mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Zero-Trust Consent Architecture
            </h2>
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>You have complete control: grant or deny Camera, Mic & Files on the next screen.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <EyeOff className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
              <span>Technicians cannot access sensors without your explicit live confirmation.</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>KDC Support is an independent diagnostic utility. Not affiliated with WhatsApp or Meta.</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="w-full max-w-md mx-auto pt-2">
        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2 group transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Syncing...' : 'Continue to Permission Setup'}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <p className="text-center text-[11px] text-slate-500 mt-2">
          Version 2.4.0 • Android 14+ Certified
        </p>
      </div>
    </div>
  );
};
