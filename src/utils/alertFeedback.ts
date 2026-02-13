const PREFS_KEY = 'meshguard-alert-prefs';

export interface AlertPrefs {
    sound: boolean;
    haptic: boolean;
}

export function getAlertPrefs(): AlertPrefs {
    try {
        const s = localStorage.getItem(PREFS_KEY);
        if (s) {
            const p = JSON.parse(s);
            return { sound: p.sound !== false, haptic: p.haptic !== false };
        }
    } catch { /* ignore */ }
    return { sound: true, haptic: true };
}

export function setAlertPrefs(prefs: Partial<AlertPrefs>) {
    const curr = getAlertPrefs();
    const next = { ...curr, ...prefs };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

export function triggerHaptic(): void {
    if (!getAlertPrefs().haptic) return;
    try {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch { /* ignore */ }
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (audioContext) return audioContext;
    try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
            audioContext = new Ctx();
            return audioContext;
        }
    } catch {
        //
    }
    return null;
}

export function playAlertSound(): void {
    if (!getAlertPrefs().sound) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
    } catch {
        // Ignore audio failures (e.g. autoplay policy)
    }
}

export function triggerAlertFeedback(): void {
    triggerHaptic();
    playAlertSound();
}
