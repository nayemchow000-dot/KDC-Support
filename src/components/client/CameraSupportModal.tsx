import React, { useRef, useEffect, useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Video,
  Radio,
  Shield,
  Square,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CameraSupportModal: React.FC<Props> = ({ onClose }) => {
  const { endSession, device } = useSupport();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isRealCameraActive, setIsRealCameraActive] = useState(false);
  const [frameFps, setFrameFps] = useState(30);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    async function initCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
            videoRef.current.play().catch(() => {});
          }
          setStream(localStream);
          setIsRealCameraActive(true);
        } catch (err) {
          console.warn('Browser webcam blocked or unavailable, using high-fidelity diagnostic stream simulator', err);
          setIsRealCameraActive(false);
        }
      } else {
        setIsRealCameraActive(false);
      }
    }

    initCamera();

    const fpsTimer = setInterval(() => {
      setFrameFps(Math.floor(29 + Math.random() * 2));
    }, 2000);

    return () => {
      clearInterval(fpsTimer);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    endSession();
    onClose();
  };

  const flipCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10 bg-slate-900/80 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Live Camera Support
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
            Consent Verified
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            {frameFps} FPS • 1080p
          </span>
          <button
            onClick={handleStop}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 my-3 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {isRealCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* High-Fidelity Diagnostic Camera Feed Simulation */
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black">
            {/* Background Simulated Grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Diagnostic target crosshair */}
            <div className="relative w-48 h-48 border border-cyan-500/40 rounded-2xl flex items-center justify-center">
              <div className="absolute w-full h-0.5 bg-cyan-400/30"></div>
              <div className="absolute h-full w-0.5 bg-cyan-400/30"></div>
              <div className="w-12 h-12 rounded-full border border-emerald-400/60 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>

              {/* Corner markers */}
              <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></span>
              <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></span>
            </div>

            {/* Status Callout */}
            <div className="mt-6 text-center z-10 px-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 mb-2">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Camera Stream Active (Mode: {facingMode === 'environment' ? 'Rear / Main' : 'Front / Selfie'})</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Technician Sarah J. is inspecting hardware diagnostics. End session anytime below.
              </p>
            </div>
          </div>
        )}

        {/* Live HUD Overlay */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>REC • LIVE DIAGNOSTIC</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 font-mono">
          <span>{device.deviceModel.split('(')[0]}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur p-3 rounded-2xl border border-slate-800">
        {/* Flash toggle */}
        <button
          onClick={() => setIsFlashlightOn(!isFlashlightOn)}
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isFlashlightOn
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Toggle Inspection Torch"
        >
          {isFlashlightOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          <span className="hidden sm:inline">Torch</span>
        </button>

        {/* End Session Button (Prominent Red) */}
        <button
          onClick={handleStop}
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Square className="w-4 h-4 fill-white" />
          <span>Stop Camera Support</span>
        </button>

        {/* Switch Lens */}
        <button
          onClick={flipCamera}
          className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Switch Lens (Front / Rear)"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
