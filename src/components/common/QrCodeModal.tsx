import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Smartphone } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Chart API QR Code image as high-res fallback + SVG fallback
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    url
  )}&bgcolor=0f172a&color=38bdf8&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Customer Mobile Test Link</h3>
            <p className="text-xs text-slate-400">Scan with your mobile camera to test live</p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center my-4 shadow-inner">
          <img
            src={qrImageUrl}
            alt="Customer Test Flow QR Code"
            className="w-52 h-52 rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10 object-contain"
            onError={(e) => {
              // Fallback simple display if external image blocked
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex items-center gap-2 mt-3 text-xs text-cyan-300 font-mono">
            <Smartphone className="w-3.5 h-3.5 animate-pulse" />
            <span>Opens directly in Customer Flow</span>
          </div>
        </div>

        {/* Link Copy Row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 truncate">
            <span className="truncate flex-1">{url}</span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Role: <strong>Customer View</strong></span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
