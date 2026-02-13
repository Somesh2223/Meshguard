import React, { useState, useEffect, useRef } from 'react';
import { Radio, QrCode, Camera, X, CheckCircle2, Terminal, RefreshCw, Wifi, Smartphone } from 'lucide-react';
import { p2pMesh } from '../network/P2pMesh';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import type { SOSMessage } from '../types/sos';

interface ConnectionsProps {
    onSendTestMessage?: () => Promise<SOSMessage>;
    initialAction?: 'generate' | 'scan' | null;
    onActionHandled?: () => void;
}

type HandshakeState = 'IDLE' | 'GENERATING' | 'SHOWING_OFFER' | 'SCANNING_ANSWER' | 'PROCESSING_SCAN' | 'SHOWING_ANSWER' | 'CONNECTING';

export const Connections: React.FC<ConnectionsProps> = ({
    onSendTestMessage,
    initialAction,
    onActionHandled
}) => {
    const [peerCount, setPeerCount] = useState(0);
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
    const [state, setState] = useState<HandshakeState>('IDLE');
    const [activeSignal, setActiveSignal] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanError, setScanError] = useState('');
    const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [scannerObject, setScannerObject] = useState<Html5Qrcode | null>(null);
    const [isCameraBlocked, setIsCameraBlocked] = useState(false);
    const [connectionMode, setConnectionMode] = useState<'wifi' | 'hotspot'>('wifi');
    const stateRef = useRef<HandshakeState>('IDLE');
    useEffect(() => { stateRef.current = state; }, [state]);

    const [qrSize, setQrSize] = useState(280);
    useEffect(() => {
        const updateSize = () => setQrSize(Math.min(window.innerWidth * 0.7, 350));
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 12));
    };

    const stopScanning = async () => {
        if (scannerObject) {
            try {
                await scannerObject.stop();
                await scannerObject.clear();
                setScannerObject(null);
            } catch (e) { /* ignore */ }
        }
        setShowScanner(false);
    };

    const handleReset = () => {
        setState('IDLE');
        setStatusMessage('');
        setActiveSignal('');
        setShowModal(false);
        setScanError('');
        setManualMode(false);
        stopScanning();
        addLog('Handshake Reset');
    };

    const handleStartInitiation = () => {
        handleReset();
        setState('GENERATING');
        setStatusMessage('Gathering Paths...');
        addLog('Searching for Local IP Paths...');
        p2pMesh.initiateConnection();
    };

    const processSignal = (text: string) => {
        try {
            const signal = p2pMesh.expandSignal(text);
            if (!signal) {
                addLog('Error: QR Expansion Failed (Corrupt?)');
                setScanError('Invalid QR Code Format');
                return;
            }

            const currentState = stateRef.current;
            addLog(`Handshake: Received ${signal.type.toUpperCase()} in ${currentState}`);

            if (signal.type === 'offer') {
                if (currentState === 'IDLE' || currentState === 'PROCESSING_SCAN' || currentState === 'SHOWING_ANSWER') {
                    if (currentState === 'PROCESSING_SCAN' || currentState === 'SHOWING_ANSWER') {
                        addLog('Info: Continuing with existing response');
                        return;
                    }
                    addLog('Offer valid. Generating secure answer...');
                    setState('PROCESSING_SCAN');
                    setStatusMessage('Generating Response...');
                    stopScanning();

                    setTimeout(() => {
                        addLog('Mesh: Creating responder instance...');
                        p2pMesh.receiveConnection(signal);
                    }, 100);
                } else {
                    addLog('Note: Initiator ignored secondary offer');
                    setScanError('Peer must scan YOUR offer first');
                }
            } else if (signal.type === 'answer') {
                if (currentState === 'SCANNING_ANSWER' || currentState === 'SHOWING_OFFER' || currentState === 'IDLE') {
                    addLog('Answer valid. Finalizing tunnel...');
                    p2pMesh.completeHandshake(signal);
                    setState('CONNECTING');
                    setStatusMessage('Establishing Tunnel...');
                    stopScanning();

                    setTimeout(() => {
                        if (stateRef.current === 'CONNECTING') {
                            addLog('Warning: Handshake timed out after 30s');
                            handleReset();
                            setScanError('Connection Timeout');
                        }
                    }, 30000);
                } else {
                    addLog('Note: Ignoring peer answer (expected offer)');
                    setScanError('Please scan the Initiator code first');
                }
            }
        } catch (err) {
            console.error('[Connections] Signal processing error:', err);
            addLog('Critical: Handshake logic failed');
            setScanError('Connection Failed');
            handleReset();
        }
    };

    const handleScanResult = async (decodedText: string) => {
        if (showModal || stateRef.current === 'CONNECTING' || stateRef.current === 'SHOWING_ANSWER') return;
        addLog(`QR Decoded (${decodedText.length} chars)`);
        processSignal(decodedText);
    };

    const handleManualSubmit = () => {
        if (!manualInput) return;
        processSignal(manualInput);
        setManualInput('');
        setManualMode(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addLog('Copied to clipboard');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const html5QrCode = new Html5Qrcode("reader");
        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            handleScanResult(decodedText);
        } catch (err) { setScanError('File Error'); }
    };

    const switchCamera = async () => {
        if (!scannerObject || cameras.length < 2) return;
        const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
        const nextId = cameras[(currentIndex + 1) % cameras.length].id;
        setSelectedCameraId(nextId);
        await scannerObject.stop();
        startScanning();
    };

    useEffect(() => {
        p2pMesh.onPeerCountChanged(() => {
            setPeerCount(p2pMesh.getPeerCount());
            setConnectedPeers(p2pMesh.getConnectedPeerIds());
            if (p2pMesh.getPeerCount() > 0) {
                addLog('Pairing Successful!');
                setStatusMessage('Connected!');
                setTimeout(() => {
                    setStatusMessage('');
                    handleReset();
                }, 3000);
            }
        });

        p2pMesh.onPeerError((err) => {
            addLog(`Error: ${err}`);
            setScanError(err);
        });

        p2pMesh.onSignal((compressed) => {
            const expanded = p2pMesh.expandSignal(compressed);
            if (!expanded) {
                addLog('Warning: Failed to expand own signal');
                return;
            }
            const isOffer = expanded.type === 'offer';
            addLog(`Signal: ${isOffer ? 'OFFER' : 'ANSWER'}`);
            setActiveSignal(compressed);

            const currentState = stateRef.current;
            if (isOffer && currentState === 'GENERATING') {
                setState('SHOWING_OFFER');
                setStatusMessage('Scan this QR with peer device');
                setShowModal(true);
                addLog('Offer QR ready');
            } else if (!isOffer && currentState === 'PROCESSING_SCAN') {
                setState('SHOWING_ANSWER');
                setStatusMessage('Show this QR to initiator');
                setShowModal(true);
                addLog('Answer QR ready');
            }
        });

        setPeerCount(p2pMesh.getPeerCount());
        setConnectedPeers(p2pMesh.getConnectedPeerIds());

        if (initialAction === 'generate') {
            handleStartInitiation();
            if (onActionHandled) onActionHandled();
        } else if (initialAction === 'scan') {
            handleReset();
            setShowScanner(true);
            if (onActionHandled) onActionHandled();
        }
    }, [initialAction, onActionHandled]);

    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices?.length) {
                setCameras(devices.map(d => ({ id: d.id, label: d.label })));
                const env = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                setSelectedCameraId(env ? env.id : devices[0].id);
            }
        }).catch(() => setIsCameraBlocked(true));
    }, []);

    const startScanning = async () => {
        const html5QrCode = new Html5Qrcode("reader");
        setScannerObject(html5QrCode);
        try {
            await html5QrCode.start(selectedCameraId, { fps: 60, qrbox: { width: 250, height: 250 } } as any, handleScanResult, () => { });
            addLog('Scanner Active');
        } catch (err) { setScanError('Camera Init Failure'); }
    };

    useEffect(() => {
        if (showScanner && selectedCameraId && !scannerObject) startScanning();
    }, [showScanner, selectedCameraId]);

    return (
        <div className="space-y-6 pb-24 px-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Connections</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60">
                    <div className={`w-2 h-2 rounded-full ${peerCount > 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span className="text-xs font-medium text-slate-300">{peerCount} device{peerCount !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Connection mode tabs */}
            <div className="flex gap-2 p-1 bg-slate-800/40 rounded-xl">
                <button
                    onClick={() => setConnectionMode('wifi')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${connectionMode === 'wifi' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Wifi className="w-4 h-4" /> WiFi
                </button>
                <button
                    onClick={() => setConnectionMode('hotspot')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${connectionMode === 'hotspot' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Smartphone className="w-4 h-4" /> Hotspot
                </button>
            </div>

            {connectionMode === 'hotspot' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-slate-300 space-y-3">
                    <p className="font-medium text-amber-200">Hotspot mode – 100% offline</p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-400">
                        <li>Device A: Turn on mobile hotspot</li>
                        <li>Device B: Join A's hotspot (WiFi settings)</li>
                        <li>Both: Turn off mobile data and disconnect from other WiFi</li>
                        <li>Connection persists – SOS messages work over local network</li>
                    </ol>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleStartInitiation}
                        className="py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <QrCode className="w-5 h-5" /> Generate
                    </button>
                    <button
                        onClick={() => { handleReset(); setShowScanner(true); }}
                        className="py-4 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Camera className="w-5 h-5" /> Scan
                    </button>
                </div>
                {peerCount > 0 && (
                    <p className="text-xs text-slate-500 text-center">
                        Add more devices: Generate on any connected device, then Scan on the new one.
                    </p>
                )}
                {peerCount > 0 && onSendTestMessage && (
                    <button
                        onClick={onSendTestMessage}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Radio className="w-4 h-4" /> Test Message
                    </button>
                )}
            </div>

            {statusMessage && (
                <div className="py-3 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-sm text-indigo-300">{statusMessage}</span>
                </div>
            )}

            {peerCount > 0 && connectedPeers.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Connected</p>
                    <div className="space-y-2">
                        {connectedPeers.map(id => (
                            <div key={id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-mono text-sm text-slate-300">{id}</span>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <details className="group">
                <summary className="cursor-pointer py-2 text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2 list-none">
                    <Terminal className="w-3 h-3" /> Logs
                </summary>
                <div className="mt-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs text-slate-500 space-y-1 max-h-32 overflow-y-auto">
                    {logs.length > 0 ? (
                        <>
                            {logs.map((log, i) => <div key={i} className={i === 0 ? 'text-indigo-400' : ''}>{log}</div>)}
                            <button onClick={() => setLogs([])} className="text-slate-600 hover:text-slate-400 mt-2">Clear</button>
                        </>
                    ) : (
                        <span className="italic opacity-60">Awaiting events...</span>
                    )}
                </div>
            </details>

            {/* QR Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">
                                {state === 'SHOWING_OFFER' ? 'Step 1: Offer' : 'Step 2: Answer'}
                            </span>
                            <button onClick={handleReset} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex justify-center p-4 bg-white rounded-xl">
                            {activeSignal ? <QRCodeCanvas value={activeSignal} size={qrSize} level="L" includeMargin /> : <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => copyToClipboard(activeSignal)} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors">Copy</button>
                            {state === 'SHOWING_OFFER' ? (
                                <button onClick={() => { setShowModal(false); setState('SCANNING_ANSWER'); setShowScanner(true); }} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors">Next</button>
                            ) : (
                                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors">Done</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner */}
            {showScanner && (
                <div className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
                            <button onClick={handleReset} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="Close"><X className="w-6 h-6" /></button>
                        </div>
                        {!manualMode ? (
                            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/50 bg-slate-900">
                                <div id="reader" className="w-full h-full" />
                                {isCameraBlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
                                        <p className="text-white font-medium mb-4">Camera access blocked</p>
                                        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-white text-black font-medium">Reload</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 p-4 rounded-2xl border border-slate-700 bg-slate-900">
                                <textarea
                                    autoFocus
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="Paste signal..."
                                    className="w-full h-28 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-indigo-400 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                                <button onClick={handleManualSubmit} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium">Connect</button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={switchCamera} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-sm font-medium text-white transition-colors">Flip</button>
                            <button onClick={() => setManualMode(!manualMode)} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${manualMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 hover:bg-white/10 border-slate-700 text-white'}`}>Manual</button>
                            <label className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-sm font-medium text-white text-center cursor-pointer transition-colors">
                                Gallery <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        {scanError && <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">{scanError}</div>}
                    </div>
                </div>
            )}

            <style>{`.animate-sweep { animation: sweep 3s infinite; } @keyframes sweep { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }`}</style>
        </div>
    );
};
