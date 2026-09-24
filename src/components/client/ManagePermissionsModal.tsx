import React from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  ArrowLeft,
  Image,
  Camera,
  Mic,
  FolderOpen,
  Smartphone,
  Shield,
  Check,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import { PermissionsState } from '../../types';

interface Props {
  onClose: () => void;
}

export const ManagePermissionsModal: React.FC<Props> = ({ onClose }) => {
  const { device, updatePermission, addAuditLog } = useSupport();
  const perms = device.permissions;

  const permConfig: {
    key: keyof PermissionsState;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'photos_videos',
      label: 'Photos & Videos',
      sublabel: perms.photos_videos.scope === 'full' ? 'Full library access' : perms.photos_videos.scope === 'selected' ? 'Selected photos only' : 'No media access',
      icon: <Image className="w-5 h-5 text-blue-400" />,
    },
    {
      key: 'camera',
      label: 'Camera',
      sublabel: 'Only while in use for live support',
      icon: <Camera className="w-5 h-5 text-emerald-400" />,
    },
    {
      key: 'microphone',
      label: 'Microphone',
      sublabel: 'Only while in use for audio diagnostics',
      icon: <Mic className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'files',
      label: 'Files & Documents',
      sublabel: 'Storage Access Framework (SAF)',
      icon: <FolderOpen className="w-5 h-5 text-indigo-400" />,
    },
    {
      key: 'device_info',
      label: 'Device Information',
      sublabel: 'Hardware model, OS, battery telemetry',
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
    },
  ];

  const allowedList = permConfig.filter((p) => perms[p.key].status === 'allowed');
  const notAllowedList = permConfig.filter((p) => perms[p.key].status === 'not_allowed');

  const toggle = (key: keyof PermissionsState) => {
    const isCurrentlyAllowed = perms[key].status === 'allowed';
    const nextStatus = isCurrentlyAllowed ? 'not_allowed' : 'allowed';
    updatePermission(key, nextStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Android App Info Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
                Android System • App Permissions
              </div>
              <h2 className="text-base font-bold text-white">KDC Support</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Done
          </button>
        </div>

        {/* System Explanation */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <p>
            Official Android permission registry for package{' '}
            <code className="text-slate-300 font-mono">com.kdc.support</code>. Toggling changes
            runtime permissions instantly.
          </p>
        </div>

        {/* Scrollable Permissions List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section: ALLOWED */}
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Allowed ({allowedList.length})</span>
            </div>

            {allowedList.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
                No permissions currently granted.
              </div>
            ) : (
              <div className="space-y-2">
                {allowedList.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-400">{item.sublabel}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggle(item.key)}
                      className="text-[11px] font-medium px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: NOT ALLOWED */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              <span>Not Allowed ({notAllowedList.length})</span>
            </div>

            {notAllowedList.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 text-center">
                All optional permissions have been granted.
              </div>
            ) : (
              <div className="space-y-2">
                {notAllowedList.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 opacity-90"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center grayscale">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-300">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.sublabel}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggle(item.key)}
                      className="text-[11px] font-medium px-3 py-1 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600 transition-colors"
                    >
                      Grant
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browser / OS Settings Info */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200">
            <div className="flex items-center gap-2 font-semibold mb-1 text-blue-300">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Browser & Hardware Synchronization</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When Camera or Microphone are toggled to "Allowed", the browser's native permission
              prompt is requested upon starting a session. If denied at the browser level, click the
              lock/tune icon in your browser address bar to allow.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};
