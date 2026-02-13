export class FallDetector {
    private threshold = 25; // m/s^2 change
    private isMonitoring = false;
    private lastAccel = { x: 0, y: 0, z: 0 };
    private onFallDetected: () => void = () => { };
    private lastFallTime = 0;
    private readonly COOLDOWN_MS = 15000; // Only one SOS per fall (15s)
    private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor() { }

    start(callback: () => void) {
        if (this.isMonitoring) return;
        this.onFallDetected = callback;

        if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            (DeviceMotionEvent as any).requestPermission()
                .then((permissionState: string) => {
                    if (permissionState === 'granted') {
                        this.enableListener();
                    }
                })
                .catch(console.error);
        } else {
            this.enableListener();
        }
    }

    stop() {
        window.removeEventListener('devicemotion', this.handleMotion);
        if (this.pendingTimeoutId !== null) {
            clearTimeout(this.pendingTimeoutId);
            this.pendingTimeoutId = null;
        }
        this.isMonitoring = false;
    }

    private enableListener() {
        window.addEventListener('devicemotion', this.handleMotion);
        this.isMonitoring = true;
    }

    private handleMotion = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;

        const { x, y, z } = {
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0
        };

        const deltaX = Math.abs(x - this.lastAccel.x);
        const deltaY = Math.abs(y - this.lastAccel.y);
        const deltaZ = Math.abs(z - this.lastAccel.z);

        const magnitudeChange = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

        if (magnitudeChange > this.threshold) {
            console.log('[FallDetector] Significant movement detected:', magnitudeChange);
            // Debounce: only one pending check at a time
            if (this.pendingTimeoutId !== null) return;

            this.pendingTimeoutId = setTimeout(() => {
                this.pendingTimeoutId = null;
                // Cooldown: one SOS per fall (ignore repeated triggers)
                if (Date.now() - this.lastFallTime < this.COOLDOWN_MS) return;
                this.lastFallTime = Date.now();
                this.onFallDetected();
            }, 500);
        }

        this.lastAccel = { x, y, z };
    };
}

export const fallDetector = new FallDetector();
