import React, { useState, useEffect } from 'react';
import { useSupport } from '../../context/SupportContext';
import { Wifi, Battery, BatteryCharging, Camera, Mic } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const { device, activeSession } = useSupport();
  const [timeString, setTimeString] = useState('10:16');
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const hasCameraActive = activeSession?.type === 'camera';
  const hasMicActive = activeSession?.type === 'audio';

  return (
    <div className="relative bg-slate-950 text-slate-100 text-xs px-5 py-2 flex items-center justify-between select-none z-30 border-b border-slate-800/40">
      {/* Left side: Time and carrier */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-tight text-[13px] text-slate-100">
          {timeString}
        </span>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          KDC Support
        </span>
      </div>

      {/* Center punch-hole camera simulation on phone frame */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-3.5 h-3.5 rounded-full bg-black ring-1 ring-slate-800 pointer-events-none hidden sm:block"></div>

      {/* Right side: Indicators, Privacy Dot, Battery */}
      <div className="flex items-center gap-2">
        {/* Android 14 Privacy Indicator (Camera / Mic) */}
        {(hasCameraActive || hasMicActive) && (
          <button
            onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
            className="flex items-center gap-1 bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse shadow-sm shadow-emerald-500/20"
            title="Privacy Indicator: Tap for details"
          >
            {hasCameraActive && <Camera className="w-3 h-3 text-emerald-400" />}
            {hasMicActive && <Mic className="w-3 h-3 text-amber-400" />}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>
        )}

        {/* Network & Battery */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium">{device.batteryLevel}%</span>
            {device.isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            ) : (
              <Battery className="w-4 h-4 text-slate-300" />
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice Dropdown / Popover */}
      {showPrivacyNotice && (
        <div className="absolute top-9 right-4 bg-slate-900 border border-slate-700 text-slate-200 p-3 rounded-xl shadow-2xl z-50 text-left max-w-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-xs text-white">Android Privacy Dashboard</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-cyan-400">KDC Support</strong> is actively utilizing{' '}
            {hasCameraActive && hasMicActive
              ? 'Camera & Microphone'
              : hasCameraActive
              ? 'Camera'
              : 'Microphone'}{' '}
            with your explicit user consent.
          </p>
          <div className="mt-2 text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            Sensor access terminates immediately when you tap "End Session".
          </div>
          <button
            onClick={() => setShowPrivacyNotice(false)}
            className="mt-2 w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
