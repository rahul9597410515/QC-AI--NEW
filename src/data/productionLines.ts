// ============================================
// QC AI — Production Lines Static/Dynamic Data
// ============================================

export type LineStatus = 'running' | 'warning' | 'stopped' | 'idle';

export interface ProductionLine {
    id: string;
    name: string;
    status: LineStatus;
    throughput: number;     // units/hr
    defectRate: number;     // %
    passRate: number;       // %
    inspections: number;
    lastDefect: Date | null;
    camera: number;
    product: string;
    target: number;         // target throughput
    uptime: number;         // %
}

function minsAgo(m: number) { return new Date(Date.now() - m * 60_000); }

export const INITIAL_LINES: ProductionLine[] = [
    {
        id: 'line-a', name: 'Line A — Chassis',
        status: 'running', throughput: 182, defectRate: 1.2, passRate: 98.8,
        inspections: 1847, lastDefect: minsAgo(3), camera: 1, product: 'Engine Block', target: 200, uptime: 97.3,
    },
    {
        id: 'line-b', name: 'Line B — Powertrain',
        status: 'warning', throughput: 134, defectRate: 4.7, passRate: 95.3,
        inspections: 2103, lastDefect: minsAgo(0.5), camera: 2, product: 'Cylinder Head', target: 180, uptime: 91.2,
    },
    {
        id: 'line-c', name: 'Line C — Brakes',
        status: 'running', throughput: 224, defectRate: 0.8, passRate: 99.2,
        inspections: 3291, lastDefect: minsAgo(12), camera: 3, product: 'Brake Disc', target: 220, uptime: 99.1,
    },
    {
        id: 'line-d', name: 'Line D — Electronics',
        status: 'stopped', throughput: 0, defectRate: 0, passRate: 0,
        inspections: 987, lastDefect: minsAgo(45), camera: 4, product: 'Connector Module', target: 150, uptime: 62.5,
    },
    {
        id: 'line-e', name: 'Line E — Assembly',
        status: 'running', throughput: 98, defectRate: 2.1, passRate: 97.9,
        inspections: 1104, lastDefect: minsAgo(8), camera: 1, product: 'Control Arm', target: 120, uptime: 88.7,
    },
    {
        id: 'line-f', name: 'Line F — Finishing',
        status: 'idle', throughput: 0, defectRate: 0, passRate: 0,
        inspections: 0, lastDefect: null, camera: 2, product: '—', target: 100, uptime: 0,
    },
];

export function updateLines(lines: ProductionLine[]): ProductionLine[] {
    return lines.map(line => {
        if (line.status === 'stopped' || line.status === 'idle') return line;
        const delta = (Math.random() - 0.48) * 4;
        const newThroughput = Math.max(0, Math.min(line.target * 1.1, line.throughput + delta));
        const defectDelta = (Math.random() - 0.5) * 0.3;
        const newDefect = Math.max(0.1, Math.min(12, line.defectRate + defectDelta));
        const shouldDefect = Math.random() < 0.08;
        return {
            ...line,
            throughput: Math.round(newThroughput),
            defectRate: Math.round(newDefect * 10) / 10,
            passRate: Math.round((100 - newDefect) * 10) / 10,
            inspections: line.inspections + Math.floor(Math.random() * 3),
            lastDefect: shouldDefect ? new Date() : line.lastDefect,
            status: newDefect > 6 ? 'warning' : 'running',
        };
    });
}
