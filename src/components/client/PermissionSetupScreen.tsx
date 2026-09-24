import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  Image,
  Camera,
  Mic,
  FolderOpen,
  Smartphone,
  CheckCircle,
  Circle,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Settings,
  HelpCircle,
  Lock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { ManagePermissionsModal } from './ManagePermissionsModal';

interface PendingDialog {
  type: 'photos' | 'camera' | 'mic' | 'files' | 'device';
  title: string;
  body: string;
  icon: React.ReactNode;
}

export const PermissionSetupScreen: React.FC = () => {
  const {
    device,
    updatePermission,
    requestPermissionFromOS,
    setClientScreen,
    isManagePermissionsOpen,
    setIsManagePermissionsOpen,
  } = useSupport();

  const [activeDialog, setActiveDialog] = useState<PendingDialog | null>(null);
  const [deniedCategory, setDeniedCategory] = useState<string | null>(null);
  const [selectedPhotoChoice, setSelectedPhotoChoice] = useState<'full' | 'selected'>('full');

  const perms = device.permissions;

  // Handle Android official permission trigger
  const handleRequest = (type: 'photos' | 'camera' | 'mic' | 'files' | 'device') => {
    setDeniedCategory(null);
    if (type === 'photos') {
      setActiveDialog({
        type: 'photos',
        title: 'Allow KDC Support to access photos and videos on this device?',
        body: 'KDC Support requires access to photos or videos you explicitly share with support technicians during diagnostic sessions.',
        icon: <Image className="w-8 h-8 text-blue-400" />,
      });
    } else if (type === 'camera') {
      setActiveDialog({
        type: 'camera',
        title: 'Allow KDC Support to take pictures and record video?',
        body: 'Used strictly for user-initiated live diagnostic camera support. The camera will never activate in the background or without an active privacy indicator.',
        icon: <Camera className="w-8 h-8 text-emerald-400" />,
      });
    } else if (type === 'mic') {
      setActiveDialog({
        type: 'mic',
        title: 'Allow KDC Support to record audio?',
        body: 'Used strictly for user-initiated voice communication with an authorized technician. The microphone will never record secretly.',
        icon: <Mic className="w-8 h-8 text-amber-400" />,
      });
    } else if (type === 'files') {
      setActiveDialog({
        type: 'files',
        title: 'Allow KDC Support to access files selected by you?',
        body: 'Uses Android Storage Access Framework (SAF). Only files and diagnostic logs you explicitly select will be accessible to support.',
        icon: <FolderOpen className="w-8 h-8 text-indigo-400" />,
      });
    } else if (type === 'device') {
      updatePermission('device_info', 'allowed');
    }
  };

  // User responses in Android OS simulated dialog
  const handleDialogResponse = async (choice: 'allow_all' | 'allow_selected' | 'while_using' | 'only_this_time' | 'deny') => {
    if (!activeDialog) return;
    const { type } = activeDialog;
    setActiveDialog(null);

    if (choice === 'deny') {
      setDeniedCategory(type);
      if (type === 'photos') updatePermission('photos_videos', 'not_allowed', { scope: 'none' });
      if (type === 'camera') updatePermission('camera', 'not_allowed');
      if (type === 'mic') updatePermission('microphone', 'not_allowed');
      if (type === 'files') updatePermission('files', 'not_allowed');
      return;
    }

    if (type === 'photos') {
      const scope = choice === 'allow_selected' ? 'selected' : 'full';
      await requestPermissionFromOS('photos_videos', { scope });
    } else if (type === 'camera') {
      const granted = await requestPermissionFromOS('camera');
      if (!granted) setDeniedCategory('camera');
    } else if (type === 'mic') {
      const granted = await requestPermissionFromOS('microphone');
      if (!granted) setDeniedCategory('mic');
    } else if (type === 'files') {
      await requestPermissionFromOS('files');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 text-white p-4 sm:p-6 pb-20 relative">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Step 1 of 2: Permission Setup
          </span>
          <button
            onClick={() => setIsManagePermissionsOpen(true)}
            className="text-xs font-medium text-slate-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Android Settings</span>
          </button>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
          Permission Management
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Configure only the access categories required for your assistance session. You can modify
          or revoke these at any time.
        </p>
      </div>

      {/* Denial Notification Banner */}
      {deniedCategory && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Permission not granted.</strong> Some remote support features will be
              disabled.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRequest(deniedCategory as any)}
              className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium text-[11px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => setIsManagePermissionsOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px]"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Permission Cards Grid */}
      <div className="space-y-3.5">
        {/* A. Photos & Videos Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Photos & Videos</h3>
                <p className="text-[11px] text-slate-400">
                  Allow KDC Support to access your photo and video library for supported support
                  features.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {perms.photos_videos.status === 'allowed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    Allowed{' '}
                    <span className="text-[10px] text-emerald-300 font-mono">
                      ({perms.photos_videos.scope === 'full' ? 'Full' : 'Selected'})
                    </span>
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Not Allowed</span>
                </span>
              )}
            </div>
          </div>

          {/* Android Photo Picker vs Full Library Option */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">Library Scope:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSelectedPhotoChoice('full')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    selectedPhotoChoice === 'full'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Library Access
                </button>
                <button
                  onClick={() => setSelectedPhotoChoice('selected')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    selectedPhotoChoice === 'selected'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Selected Photos
                </button>
              </div>
            </div>

            <button
              onClick={() => handleRequest('photos')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium transition-colors self-end sm:self-auto"
            >
              {perms.photos_videos.status === 'allowed' ? 'Change Scope' : 'Grant Photos Access'}
            </button>
          </div>
        </div>

        {/* B. Camera Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Camera</h3>
                <p className="text-[11px] text-slate-400">
                  Allow camera access when a support session requires it.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {perms.camera.status === 'allowed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Not Allowed</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Never activates secretly or in background.
            </span>
            <button
              onClick={() => handleRequest('camera')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
            >
              {perms.camera.status === 'allowed' ? 'Modify' : 'Allow Camera'}
            </button>
          </div>
        </div>

        {/* C. Microphone Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Microphone</h3>
                <p className="text-[11px] text-slate-400">
                  Allow microphone access for an explicitly started support/audio session.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {perms.microphone.status === 'allowed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Not Allowed</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Microphone never records secretly.
            </span>
            <button
              onClick={() => handleRequest('mic')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
            >
              {perms.microphone.status === 'allowed' ? 'Modify' : 'Allow Microphone'}
            </button>
          </div>
        </div>

        {/* D. Files & Documents Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Files & Documents</h3>
                <p className="text-[11px] text-slate-400">
                  Allow access to files selected by you for support purposes.
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {perms.files.status === 'allowed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Not Allowed</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Storage Access Framework (SAF)
            </span>
            <button
              onClick={() => handleRequest('files')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
            >
              {perms.files.status === 'allowed' ? 'Modify' : 'Allow Files Access'}
            </button>
          </div>
        </div>

        {/* E. Device Information Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Device Information</h3>
                <p className="text-[11px] text-slate-400">
                  Collects non-sensitive device telemetry (model, OS version, app build, battery
                  and connection status).
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {perms.device_info.status === 'allowed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Circle className="w-3.5 h-3.5" />
                  <span>Not Allowed</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              ID: {device.deviceId}
            </span>
            <button
              onClick={() => handleRequest('device')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-700/80 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
            >
              {perms.device_info.status === 'allowed' ? 'Refreshed ✓' : 'Allow Device Info'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => setIsManagePermissionsOpen(true)}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Manage Permissions in Settings</span>
        </button>

        <button
          onClick={() => setClientScreen('login')}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Android OS Native Permission Dialog Simulation Overlay */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800/90 flex items-center justify-center mb-4 ring-1 ring-slate-700">
              {activeDialog.icon}
            </div>

            <h3 className="text-base font-bold text-white mb-2 leading-snug">
              {activeDialog.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {activeDialog.body}
            </p>

            {activeDialog.type === 'photos' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleDialogResponse('allow_all')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Allow all photos & videos
                </button>
                <button
                  onClick={() => handleDialogResponse('allow_selected')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  Select photos and videos
                </button>
                <button
                  onClick={() => handleDialogResponse('deny')}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-400 hover:text-rose-400"
                >
                  Don't allow
                </button>
              </div>
            ) : activeDialog.type === 'camera' || activeDialog.type === 'mic' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleDialogResponse('while_using')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  While using the app
                </button>
                <button
                  onClick={() => handleDialogResponse('only_this_time')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  Only this time
                </button>
                <button
                  onClick={() => handleDialogResponse('deny')}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-400 hover:text-rose-400"
                >
                  Don't allow
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleDialogResponse('while_using')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Allow
                </button>
                <button
                  onClick={() => handleDialogResponse('deny')}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-400 hover:text-rose-400"
                >
                  Don't allow
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Android Settings Modal */}
      {isManagePermissionsOpen && (
        <ManagePermissionsModal onClose={() => setIsManagePermissionsOpen(false)} />
      )}
    </div>
  );
};
