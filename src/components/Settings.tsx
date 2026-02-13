import React from 'react';
import { Shield, Bell, Vibrate, Trash2, Info } from 'lucide-react';
import { offlineStorage } from '../services/OfflineStorage';

interface SettingsProps {
    fallDetectionEnabled: boolean;
    onToggleFallDetection: (val: boolean) => void;
    soundEnabled: boolean;
    onToggleSound: (val: boolean) => void;
    hapticEnabled: boolean;
    onToggleHaptic: (val: boolean) => void;
    onClearHistory: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
    fallDetectionEnabled,
    onToggleFallDetection,
    soundEnabled,
    onToggleSound,
    hapticEnabled,
    onToggleHaptic,
    onClearHistory,
}) => {
    const handleClearHistory = async () => {
        if (!confirm('Delete all message history? This cannot be undone.')) return;
        try {
            const db = await offlineStorage['db'];
            const tx = db.transaction('messages', 'readwrite');
            const store = tx.objectStore('messages');
            await store.clear();
            onClearHistory();
        } catch (err) {
            console.error('Clear failed:', err);
        }
    };

    const SettingRow = ({ icon: Icon, label, desc, checked, onToggle }: {
        icon: React.ElementType;
        label: string;
        desc?: string;
        checked: boolean;
        onToggle: (v: boolean) => void;
    }) => (
        <button
            onClick={() => onToggle(!checked)}
            className="w-full flex items-center justify-between py-4 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 transition-colors text-left"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-700/50">
                    <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                    <p className="font-medium text-white">{label}</p>
                    {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
                </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'left-6' : 'left-1'}`} />
            </div>
        </button>
    );

    return (
        <div className="space-y-6 pb-24 px-2">
            <h2 className="text-lg font-semibold text-white">Settings</h2>

            <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Safety</p>
                <SettingRow
                    icon={Shield}
                    label="Fall Detection"
                    desc="Auto-SOS when impact detected"
                    checked={fallDetectionEnabled}
                    onToggle={onToggleFallDetection}
                />
            </div>

            <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alerts</p>
                <SettingRow
                    icon={Bell}
                    label="Sound Alerts"
                    desc="Play tone on fall or panic"
                    checked={soundEnabled}
                    onToggle={onToggleSound}
                />
                <SettingRow
                    icon={Vibrate}
                    label="Haptic Feedback"
                    desc="Vibrate on alerts"
                    checked={hapticEnabled}
                    onToggle={onToggleHaptic}
                />
            </div>

            <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Data</p>
                <button
                    onClick={handleClearHistory}
                    className="w-full flex items-center justify-between py-4 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                            <Trash2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Clear Message History</p>
                            <p className="text-xs text-slate-500 mt-0.5">Delete all stored SOS messages</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-sm">
                <Info className="w-4 h-4" />
                <span>MeshGuard · Offline-first disaster response</span>
            </div>
        </div>
    );
};
