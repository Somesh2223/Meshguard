import React from 'react';
import { Clock, MapPin, AlertCircle, Shield } from 'lucide-react';
import type { SOSMessage } from '../types/sos';

interface MessageCardProps {
    message: SOSMessage;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isPanic = message.isPanic ?? message.text.includes('PANIC BUTTON');
    const cardStyle = message.isAutoTriggered
        ? 'border-red-500/30 bg-red-500/5 backdrop-blur-lg'
        : isPanic
            ? 'border-orange-500/30 bg-orange-500/5 backdrop-blur-lg'
            : 'border-white/5 bg-slate-900/40 backdrop-blur-lg';
    const iconStyle = message.isAutoTriggered
        ? 'bg-red-500/20 text-red-400'
        : isPanic
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-blue-500/10 text-blue-400';

    return (
        <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] cursor-pointer ${cardStyle} space-y-4 shadow-xl`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${iconStyle}`}>
                        {message.isAutoTriggered ? <AlertCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {time}
                        </div>
                        {message.isAutoTriggered && (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                Fall Intelligence Trigger
                            </span>
                        )}
                        {isPanic && !message.isAutoTriggered && (
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                                Panic Button
                            </span>
                        )}
                    </div>
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border tracking-widest ${message.status === 'relayed' ? 'border-blue-500/50 text-blue-400 bg-blue-500/5' :
                    message.status === 'queued' ? 'border-amber-500/50 text-amber-400 bg-amber-500/5' : 'border-slate-700 text-slate-500'
                    }`}>
                    {message.status.toUpperCase()}
                </span>
            </div>

            <p className="text-slate-200 text-base font-medium leading-relaxed px-1">
                {message.text}
            </p>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-4 border-t border-white/5 uppercase tracking-widest px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    Network Hops: {message.hops}
                </div>
                {message.location && (
                    <div className="flex items-center gap-1.5 text-blue-400/80">
                        <MapPin className="w-3 h-3" />
                        Loc: {message.location.latitude.toFixed(3)}, {message.location.longitude.toFixed(3)}
                    </div>
                )}
            </div>
        </div>
    );
};
