import React from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  ShieldAlert,
  Camera,
  Mic,
  FolderOpen,
  Check,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const SessionConsentModal: React.FC = () => {
  const { pendingConsentRequest, respondToConsentRequest } = useSupport();

  if (!pendingConsentRequest) return null;

  const { type, requestedBy, timestamp } = pendingConsentRequest;

  const getIcon = () => {
    switch (type) {
      case 'camera':
        return <Camera className="w-8 h-8 text-emerald-400" />;
      case 'audio':
        return <Mic className="w-8 h-8 text-amber-400" />;
      case 'files':
        return <FolderOpen className="w-8 h-8 text-indigo-400" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'camera':
        return 'Camera Support Stream Requested';
      case 'audio':
        return 'Audio Support Session Requested';
      case 'files':
        return 'File Inspection Requested';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'camera':
        return 'An authorized support technician is requesting to activate your camera for remote hardware diagnostics. The camera will not activate unless you explicitly grant permission below.';
      case 'audio':
        return 'An authorized technician is requesting to open a voice support channel. Your microphone will not transmit unless you explicitly approve.';
      case 'files':
        return 'The support agent is requesting to inspect your explicitly authorized diagnostic files.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
        {/* Emblem */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 ring-2 ring-cyan-500/30">
          {getIcon()}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-[10px] font-semibold tracking-wider uppercase mb-2">
          <ShieldAlert className="w-3 h-3 text-cyan-400" />
          <span>Explicit User Consent Required</span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 leading-snug">
          {getTitle()}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {getDescription()}
        </p>

        {/* Requester detail */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-[11px] text-slate-400 mb-5 space-y-1">
          <div className="flex justify-between">
            <span>Requester:</span>
            <strong className="text-slate-200">{requestedBy}</strong>
          </div>
          <div className="flex justify-between">
            <span>Requested At:</span>
            <span className="font-mono text-slate-300">{timestamp}</span>
          </div>
          <div className="flex justify-between">
            <span>Privacy Rule:</span>
            <span className="text-emerald-400 font-medium">Auto-shuts down on end</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => respondToConsentRequest(false)}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Decline</span>
          </button>

          <button
            onClick={() => respondToConsentRequest(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};
