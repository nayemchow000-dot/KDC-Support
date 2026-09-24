import React from 'react';
import { AndroidPhoneFrame } from '../client/AndroidPhoneFrame';
import { AdminDashboard } from '../admin/AdminDashboard';
import { Smartphone, ShieldCheck, Zap } from 'lucide-react';

export const SplitView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-[calc(100vh-60px)] bg-slate-950">
      {/* Left Column: Android Device Simulator */}
      <div className="w-full xl:w-[480px] xl:shrink-0 border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-950 flex flex-col">
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Client: Android Device View</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            Interactive Client
          </span>
        </div>

        <div className="flex-1 overflow-y-auto flex items-center justify-center p-2">
          <AndroidPhoneFrame />
        </div>
      </div>

      {/* Right Column: Authorized Support Dashboard */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Support Engineer Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Instant Socket Sync Active</span>
          </div>
        </div>

        <div className="flex-1">
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
};
