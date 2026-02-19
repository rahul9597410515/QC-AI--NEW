// ============================================
// QC AI Backend — Sensor Simulator Service
// Mirrors the frontend src/data/sensorStream.ts
// ============================================

export interface SensorReading {
    name: string;
    key: string;
    value: number;
    min: number;
    max: number;
    warnMin: number;
    warnMax: number;
    critMin: number;
    critMax: number;
    unit: string;
    status: 'ok' | 'warning' | 'critical';
}

export interface SensorSnapshot {
    timestamp: Date;
    temperature: number;
    vibration: number;
    pressure: number;
    humidity: number;
    speed: number;
    current: number;
}

const SENSOR_CONFIGS: Omit<SensorReading, 'value' | 'status'>[] = [
    { name: 'Temperature', key: 'temperature', min: 0, max: 120, warnMin: 60, warnMax: 90, critMin: 0, critMax: 100, unit: '°C' },
    { name: 'Vibration', key: 'vibration', min: 0, max: 10, warnMin: 0, warnMax: 6, critMin: 0, critMax: 8, unit: 'g' },
    { name: 'Pressure', key: 'pressure', min: 0, max: 10, warnMin: 2, warnMax: 7, critMin: 1, critMax: 9, unit: 'bar' },
    { name: 'Humidity', key: 'humidity', min: 0, max: 100, warnMin: 40, warnMax: 70, critMin: 20, critMax: 85, unit: '%' },
    { name: 'Line Speed', key: 'speed', min: 0, max: 200, warnMin: 60, warnMax: 160, critMin: 0, critMax: 180, unit: 'ppm' },
    { name: 'Current', key: 'current', min: 0, max: 50, warnMin: 20, warnMax: 40, critMin: 5, critMax: 45, unit: 'A' },
];

export { SENSOR_CONFIGS };

type SensorKey = 'temperature' | 'vibration' | 'pressure' | 'humidity' | 'speed' | 'current';
let sensorPhase: Record<SensorKey, number> = {
    temperature: 0, vibration: 1, pressure: 2, humidity: 0.5, speed: 1.5, current: 0.8,
};

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export function generateSensorReadings(): SensorReading[] {
    const steps: Record<SensorKey, number> = {
        temperature: 0.03, vibration: 0.07, pressure: 0.02,
        humidity: 0.015, speed: 0.04, current: 0.05,
    };
    (Object.keys(steps) as SensorKey[]).forEach(k => { sensorPhase[k] += steps[k]; });

    const bases: Record<SensorKey, [number, number, number]> = {
        temperature: [72, 14, 2], vibration: [3.5, 1.8, 0.4], pressure: [4.5, 1.5, 0.2],
        humidity: [55, 10, 2], speed: [110, 30, 8], current: [28, 8, 1.5],
    };

    return SENSOR_CONFIGS.map(cfg => {
        const key = cfg.key as SensorKey;
        const [center, amp, noise] = bases[key];
        const phase = sensorPhase[key];
        const spike = Math.random() < 0.05 ? (Math.random() * amp * 0.8) * (Math.random() < 0.5 ? 1 : -1) : 0;
        const value = clamp(
            center + Math.sin(phase) * amp + (Math.random() - 0.5) * noise * 2 + spike,
            cfg.min, cfg.max
        );
        const status: SensorReading['status'] =
            value > cfg.critMax || value < cfg.critMin ? 'critical' :
                value > cfg.warnMax || value < cfg.warnMin ? 'warning' : 'ok';
        return { ...cfg, value: Math.round(value * 10) / 10, status };
    });
}

export function generateSensorSnapshot(): SensorSnapshot {
    const readings = generateSensorReadings();
    const get = (key: string) => readings.find(r => r.key === key)?.value ?? 0;
    return {
        timestamp: new Date(),
        temperature: get('temperature'), vibration: get('vibration'), pressure: get('pressure'),
        humidity: get('humidity'), speed: get('speed'), current: get('current'),
    };
}
