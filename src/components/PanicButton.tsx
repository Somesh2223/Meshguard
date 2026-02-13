import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { triggerAlertFeedback } from '../utils/alertFeedback';

interface PanicButtonProps {
    onConfirm: () => void;
}

const HOLD_DURATION_MS = 2500;

export const PanicButton: React.FC<PanicButtonProps> = ({ onConfirm }) => {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const cancelHold = useCallback(() => {
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setIsHolding(false);
        setProgress(0);
    }, []);

    const handlePointerDown = useCallback(() => {
        setIsHolding(true);
        startTimeRef.current = Date.now();

        holdTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const p = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
            setProgress(p);

            if (p >= 100) {
                if (holdTimerRef.current) {
                    clearInterval(holdTimerRef.current);
                    holdTimerRef.current = null;
                }
                setIsHolding(false);
                setProgress(0);
                triggerAlertFeedback();
                onConfirm();
            }
        }, 50);
    }, [onConfirm]);

    const handlePointerUp = useCallback(() => {
        if (progress < 100) {
            cancelHold();
        }
    }, [progress, cancelHold]);

    const handlePointerLeave = useCallback(() => {
        if (progress < 100) {
            cancelHold();
        }
    }, [progress, cancelHold]);

    return (
        <div className="flex flex-col items-center gap-3">
            <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerUp}
                className="relative w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] text-white flex items-center justify-center overflow-hidden transition-all duration-300 active:scale-[0.95] select-none touch-none"
            >
                {/* Circular progress fill */}
                {isHolding && (
                    <div
                        className="absolute inset-0 rounded-full transition-all duration-75 ease-linear"
                        style={{ background: `conic-gradient(rgba(239,68,68,0.9) 0deg ${progress * 3.6}deg, transparent ${progress * 3.6}deg)` }}
                    />
                )}
                <AlertTriangle className="w-10 h-10 relative z-10" />
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isHolding ? `Hold... ${Math.round(progress)}%` : 'Hold to Send SOS'}
            </span>
        </div>
    );
};
