import React, { useEffect, useState, useRef } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  Radio,
  X,
  Shield,
  PhoneCall,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const AudioSupportModal: React.FC<Props> = ({ onClose }) => {
  const { endSession, device } = useSupport();
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([12, 24, 45, 18, 55, 30, 70, 40, 20, 35, 60, 28]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Timer for duration
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Audio analyser setup
    async function initAudio() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVisualizer = () => {
              if (!analyser || isMuted) {
                requestAnimationFrame(updateVisualizer);
                return;
              }
              analyser.getByteFrequencyData(dataArray);
              const sliced = Array.from(dataArray.slice(0, 14)).map((v) => Math.max(10, Math.round((v / 255) * 100)));
              setAudioLevels(sliced);
              requestAnimationFrame(updateVisualizer);
            };
            updateVisualizer();
          }
        } catch (err) {
          console.warn('Real microphone unavailable or blocked, utilizing high-fidelity audio simulator', err);
          // Fallback animated waveform
          const animInterval = setInterval(() => {
            if (isMuted) {
              setAudioLevels(new Array(14).fill(6));
            } else {
              setAudioLevels(
                Array.from({ length: 14 }, () => Math.floor(15 + Math.random() * 75))
              );
            }
          }, 120);
          return () => clearInterval(animInterval);
        }
      }
    }

    initAudio();

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isMuted]);

  const handleStop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    endSession();
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between z-10 bg-slate-900/80 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <Mic className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Audio Support Session
          </span>
          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full">
            Explicit Voice Active
          </span>
        </div>

        <button
          onClick={handleStop}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="End Audio Support"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Voice Canvas */}
      <div className="flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full text-center">
        {/* Pulsing Avatar / Session Node */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-full blur-xl transition-all ${
            isMuted ? 'bg-slate-800' : 'bg-amber-500/25 animate-pulse'
          }`}></div>
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-1 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
              {isMuted ? (
                <MicOff className="w-10 h-10 text-rose-400" />
              ) : (
                <PhoneCall className="w-10 h-10 text-amber-400 animate-bounce" />
              )}
            </div>
          </div>
        </div>

        {/* Technician Info */}
        <h3 className="text-lg font-bold text-white mb-1">
          Support Engineer Connected
        </h3>
        <p className="text-xs text-slate-400 mb-2">
          Sarah Jenkins • KDC Tier-2 Hardware Specialist
        </p>

        {/* Call Duration */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 font-mono text-sm text-cyan-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{formatTime(callDuration)}</span>
        </div>

        {/* Live Equalizer Waveform */}
        <div className="w-full h-24 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 flex items-center justify-center gap-1.5 mb-6">
          {audioLevels.map((lvl, index) => (
            <div
              key={index}
              className={`w-2.5 rounded-full transition-all duration-75 ${
                isMuted
                  ? 'bg-slate-800 h-2'
                  : 'bg-gradient-to-t from-amber-500 to-orange-400'
              }`}
              style={{ height: isMuted ? '6px' : `${Math.max(8, lvl * 0.7)}px` }}
            ></div>
          ))}
        </div>

        {/* Security Rule Assurance */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 max-w-xs leading-relaxed">
          <Shield className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
          Voice audio is transmitted solely during this active screen. The microphone will never
          record secretly in the background.
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full bg-slate-900/90 backdrop-blur p-3 rounded-2xl border border-slate-800">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
            isMuted
              ? 'bg-rose-950/70 border-rose-800 text-rose-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-amber-400" />}
          <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
        </button>

        {/* Stop Audio Button */}
        <button
          onClick={handleStop}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-xl shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>End Audio Support</span>
        </button>
      </div>
    </div>
  );
};
