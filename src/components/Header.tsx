import React from 'react';
import { Radio, Activity } from 'lucide-react';

interface HeaderProps {
    isOnline: boolean;
    isMeshActive: boolean;
    isFallDetectionOn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isOnline, isMeshActive, isFallDetectionOn }) => {
    return (
        <header className="fixed top-0 left-0 right-0 max-w-lg mx-auto bg-slate-950/80 backdrop-blur border-b border-slate-800 z-50 px-4 py-3 flex items-center justify-between">
            <h1 className="text-base font-semibold text-white">MeshGuard</h1>
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500" title={isFallDetectionOn ? 'Fall detection on' : 'Fall detection off'}>
                    <Activity className={`w-4 h-4 ${isFallDetectionOn ? 'text-emerald-500' : 'text-slate-600'}`} />
                    {isFallDetectionOn && <span className="hidden sm:inline">AI</span>}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500" title="Mesh status">
                    <Radio className={`w-4 h-4 ${isMeshActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                </span>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} title={isOnline ? 'Online' : 'Offline'} aria-hidden />
            </div>
        </header>
    );
};
