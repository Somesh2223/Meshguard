/**
 * Haptic feedback and sound alerts for fall detection and panic button.
 */

export function triggerHaptic(): void {
    try {
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch {
        // Ignore on unsupported devices
    }
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
