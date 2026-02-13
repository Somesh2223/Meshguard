import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { SOSMessage } from '../types/sos';

interface MessageCardProps {
    message: SOSMessage;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isPanic = message.isPanic ?? message.text.includes('PANIC BUTTON');
    const borderColor = message.isAutoTriggered ? 'border-l-red-500' : isPanic ? 'border-l-orange-500' : 'border-l-indigo-500';

    return (
        <div className={`p-4 rounded-xl bg-slate-800/40 border border-slate-700 border-l-4 ${borderColor}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {time}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">{message.status}</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{message.text}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                <span>Hops: {message.hops}</span>
                {message.location && (
                    <a
                        href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-400 hover:underline"
                    >
                        <MapPin className="w-3 h-3" /> Map
                    </a>
                )}
            </div>
        </div>
    );
};
