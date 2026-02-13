import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { triggerAlertFeedback } from '../utils/alertFeedback';

interface PanicButtonProps {
  onConfirm: () => void;
}

export const PanicButton: React.FC<PanicButtonProps> = ({ onConfirm }) => {
  return (
    <button
      type="button"
      onClick={() => {
        triggerAlertFeedback();
        onConfirm();
      }}
      className="relative w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 shadow-xl shadow-red-900/60 flex items-center justify-center transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 focus-visible:ring-offset-slate-950 animate-pulse"
    >
      <span className="absolute inset-0 rounded-full bg-red-500/40 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />

      <AlertOctagon className="relative z-10 w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(248,250,252,0.8)]" />

      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-[0.3em] uppercase text-orange-300/90">
        Panic
      </span>
    </button>
  );
};

