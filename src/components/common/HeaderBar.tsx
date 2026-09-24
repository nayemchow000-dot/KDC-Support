import React from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  Smartphone,
  ShieldCheck,
  Columns,
  Wifi,
  WifiOff,
  RotateCcw,
  Camera,
  Mic,
  Lock,
  Cloud,
  CheckCircle2,
  Radio,
  QrCode,
  Share2,
} from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isPhoneFrame,
    setIsPhoneFrame,
    device,
    toggleDeviceConnection,
    activeSession,
    resetAll,
    allDevices,
    activeMobileDevice,
    setSelectedAdminDeviceId,
    isCloudSynced,
    setIsQrModalOpen,
  } = useSupport();

  const isConnected = device.connectionStatus === 'connected';
  const connectedCount = allDevices.filter((d) => d.connectionStatus === 'connected').length;

  return (
    <>
      {/* Real-time Multi-Device Connection Notification Banner */}
      {activeMobileDevice && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#0d2a1f] to-teal-950 border-b border-emerald-700/60 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              মোবাইল সংযুক্ত হয়েছে:
            </span>
            <span className="font-semibold text-emerald-300">
              {activeMobileDevice.deviceName} ({activeMobileDevice.deviceModel})
            </span>
            <span className="text-[11px] text-emerald-400/80 font-mono hidden md:inline">
              আইডি: {activeMobileDevice.userPhone || activeMobileDevice.userEmail}
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedAdminDeviceId(activeMobileDevice.deviceId);
              setCurrentView('admin');
            }}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <span>ড্যাশবোর্ডে পারমিশন ও তথ্য দেখুন</span>
            <span>→</span>
          </button>
        </div>
      )}

      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  KDC Support
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Official
                </span>
                {/* Cloud Sync Indicator */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                  <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Cloud Sync: {connectedCount} Online</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Zero-Trust Consent Remote Support Platform
              </p>
            </div>
          </div>

          {/* View Switcher: Client / Admin / Dual */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setCurrentView('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'client'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Switch to Android Client View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android App</span>
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Switch to Authorized Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Support Dashboard</span>
              {activeMobileDevice && currentView !== 'admin' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1"></span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hidden md:flex ${
                currentView === 'split'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Side-by-Side Dual View (Test Live Sync)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>
          </div>

          {/* Quick Diagnostics & Privacy Indicators */}
          <div className="flex items-center gap-2">
            {/* Share / QR Code button */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 text-xs font-medium transition-colors"
              title="Open QR Code or Link for Mobile Testing"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Mobile Test Link</span>
            </button>

            {/* Active Hardware Privacy Indicator */}
            {activeSession && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs animate-pulse">
                {activeSession.type === 'camera' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80"></span>
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">Camera Active</span>
                  </>
                ) : activeSession.type === 'audio' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/80"></span>
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-400">Mic Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span className="text-[11px] font-medium text-cyan-400">Files Shared</span>
                  </>
                )}
              </div>
            )}

            {/* Toggle Device Online/Offline simulation */}
            <button
              onClick={toggleDeviceConnection}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-rose-950/50 border-rose-800/80 text-rose-300 hover:bg-rose-900/60'
              }`}
              title="Simulate Device Online / Offline Status"
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isConnected ? 'Online' : 'Offline'}</span>
            </button>

            {/* Frame Toggle (When on client view) */}
            {currentView === 'client' && (
              <button
                onClick={() => setIsPhoneFrame(!isPhoneFrame)}
                className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isPhoneFrame
                    ? 'bg-slate-800 border-slate-700 text-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title={isPhoneFrame ? 'Disable Phone Skin (Full Screen)' : 'Enable Phone Skin'}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            {/* Reset / Factory State */}
            <button
              onClick={resetAll}
              className="p-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
              title="Reset Demo State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
