import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

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
        <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerUp}
            className="relative w-full py-6 rounded-[2rem] bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors overflow-hidden active:scale-[0.98] select-none touch-none"
        >
            {/* Progress fill */}
            {isHolding && (
                <div
                    className="absolute inset-0 bg-red-500/80 transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            )}
            <AlertTriangle className="w-8 h-8 relative z-10" />
            <span className="relative z-10">
                {isHolding ? `Hold... ${Math.round(progress)}%` : 'Hold to Send SOS'}
            </span>
        </button>
    );
};
