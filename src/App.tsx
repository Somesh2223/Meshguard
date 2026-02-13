import { useState, useEffect } from 'react';
import { useSOS } from './hooks/useSOS';
import { Header } from './components/Header';
import { SosForm } from './components/SosForm';
import { MessageCard } from './components/MessageCard';
import { Settings } from './components/Settings';
import { Connections } from './components/Connections';
import { FallCountdownModal } from './components/FallCountdownModal';
import { PanicButton } from './components/PanicButton';
import { fallDetector } from './ai/FallDetector';
import { triggerAlertFeedback, getAlertPrefs, setAlertPrefs } from './utils/alertFeedback';
import { LayoutDashboard, MessageSquare, Settings as SettingsIcon, Link2, Radio } from 'lucide-react';

function App() {
  const { messages, isOnline, sendSOS, sendTestMessage, refreshMessages } = useSOS();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages' | 'connections' | 'settings'>('dashboard');
  const [fallDetectionOn, setFallDetectionOn] = useState(false);
  const [pairingAction, setPairingAction] = useState<'generate' | 'scan' | null>(null);
  const [pendingFall, setPendingFall] = useState<{ severity: string; magnitude: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => getAlertPrefs().sound);
  const [hapticEnabled, setHapticEnabled] = useState(() => getAlertPrefs().haptic);

  useEffect(() => {
    if (fallDetectionOn) {
      fallDetector.start((severity, magnitude) => {
        triggerAlertFeedback();
        setPendingFall({ severity, magnitude });
      });
    } else {
      fallDetector.stop();
    }
    return () => fallDetector.stop();
  }, [fallDetectionOn]);

  const handleToggleSound = (v: boolean) => {
    setSoundEnabled(v);
    setAlertPrefs({ sound: v });
  };
  const handleToggleHaptic = (v: boolean) => {
    setHapticEnabled(v);
    setAlertPrefs({ haptic: v });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <Header isOnline={isOnline} isMeshActive={true} isFallDetectionOn={fallDetectionOn} />

      <main className="max-w-lg mx-auto px-4 pt-20 pb-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-white">MeshGuard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Emergency SOS · Offline mesh</p>
            </div>

            <SosForm onSend={(text) => sendSOS(text)} />

            <div className="flex justify-center">
              <PanicButton onConfirm={() => sendSOS('🚨 PANIC BUTTON – Emergency assistance required at this location.', false, true)} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setActiveTab('connections'); setPairingAction('generate'); }}
                className="flex-1 py-4 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Link2 className="w-5 h-5" /> Connect
              </button>
              <button
                onClick={sendTestMessage}
                className="flex-1 py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Radio className="w-5 h-5" /> Test
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent</p>
              {messages.length === 0 ? (
                <div className="py-12 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-slate-500 text-sm">
                  No SOS reports yet
                </div>
              ) : (
                messages.slice(0, 3).map(m => <MessageCard key={m.id} message={m} />)
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Message History</h2>
              <span className="text-xs text-slate-500">{messages.length} total</span>
            </div>
            {messages.length === 0 ? (
              <div className="py-12 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-slate-500 text-sm">
                No messages yet
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(m => <MessageCard key={m.id} message={m} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <Connections
            onSendTestMessage={sendTestMessage}
            initialAction={pairingAction}
            onActionHandled={() => setPairingAction(null)}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            fallDetectionEnabled={fallDetectionOn}
            onToggleFallDetection={setFallDetectionOn}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            hapticEnabled={hapticEnabled}
            onToggleHaptic={handleToggleHaptic}
            onClearHistory={refreshMessages}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-3 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around z-50">
        <NavButton icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavButton icon={MessageSquare} label="Feed" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
        <NavButton icon={Link2} label="Connect" active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} />
        <NavButton icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {pendingFall && (
        <FallCountdownModal
          severity={pendingFall.severity}
          magnitude={pendingFall.magnitude}
          onCancel={() => setPendingFall(null)}
          onSend={(msg) => {
            sendSOS(msg, true);
            setPendingFall(null);
          }}
        />
      )}
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors min-w-[64px] ${
        active ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default App;
