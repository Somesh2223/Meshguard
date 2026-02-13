export class FallDetector {
    private threshold = 50; // m/s^2 change
    private isMonitoring = false;
    private lastAccel = { x: 0, y: 0, z: 0 };
    private onFallDetected: (severity: string, magnitude: number) => void = () => { };
    private lastFallTime = 0;
    private readonly COOLDOWN_MS = 15000; // Only one SOS per fall (15s)
    private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private maxMagnitudeThisBurst = 0;

    constructor() { }

    start(callback: (severity: string, magnitude: number) => void) {
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
            if (this.pendingTimeoutId === null) {
                this.maxMagnitudeThisBurst = magnitudeChange;
                this.pendingTimeoutId = setTimeout(() => {
                    this.pendingTimeoutId = null;
                    const magnitude = this.maxMagnitudeThisBurst;
                    if (Date.now() - this.lastFallTime < this.COOLDOWN_MS) return;
                    this.lastFallTime = Date.now();
                    const severity = this.getSeverity(magnitude);
                    this.onFallDetected(severity, magnitude);
                }, 500);
            } else {
                this.maxMagnitudeThisBurst = Math.max(this.maxMagnitudeThisBurst, magnitudeChange);
            }
        }

        this.lastAccel = { x, y, z };
    };

    private getSeverity(magnitude: number): string {
        if (magnitude >= 70) return 'Critical';
        if (magnitude >= 50) return 'Severe';
        if (magnitude >= 35) return 'Moderate';
        return 'Light';
    }
}

export const fallDetector = new FallDetector();
