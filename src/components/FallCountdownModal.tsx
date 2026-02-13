import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface FallCountdownModalProps {
    severity: string;
    magnitude: number;
    onCancel: () => void;
    onSend: (msg: string) => void;
}

const COUNTDOWN_SECONDS = 5;

export const FallCountdownModal: React.FC<FallCountdownModalProps> = ({
    severity,
    magnitude,
    onCancel,
    onSend,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
    const onSendRef = useRef(onSend);
    onSendRef.current = onSend;

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    const msg = `🚨 AUTOMATIC FALL DETECTED - ${severity} impact (${Math.round(magnitude)} m/s²). Assistance required at this location.`;
                    onSendRef.current(msg);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [severity, magnitude]);

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-red-500/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-2xl">
                            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Fall Detected</h3>
                            <p className="text-slate-400 text-sm mt-1">Cancel if this was a false alarm</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 hover:scale-110 transition-all duration-300"
                        aria-label="Cancel"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full border-4 border-red-500/30 flex items-center justify-center">
                            <span className="text-4xl font-black text-red-500">{secondsLeft}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(secondsLeft / COUNTDOWN_SECONDS) * 100}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-center text-slate-500 text-sm">
                        SOS will send automatically in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}
                    </p>

                    <button
                        onClick={onCancel}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 hover:scale-[1.02] text-white font-black rounded-2xl uppercase tracking-widest transition-all duration-300 border border-white/5"
                    >
                        Cancel – False Alarm
                    </button>
                </div>
            </div>
        </div>
    );
};
