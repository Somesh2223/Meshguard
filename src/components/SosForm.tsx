import React, { useState } from 'react';
import { Send, MapPin } from 'lucide-react';

interface SosFormProps {
    onSend: (text: string) => void;
}

export const SosForm: React.FC<SosFormProps> = ({ onSend }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What is your emergency?"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 min-h-[100px] text-base resize-none"
            />
            <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> Location attached
                </span>
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium text-sm flex items-center gap-2 transition-colors"
                >
                    <Send className="w-4 h-4" /> Send SOS
                </button>
            </div>
        </form>
    );
};
