// ============================================
// QC AI Backend — Defect Simulator Service
// Mirrors the frontend src/data/defectStream.ts
// ============================================

export type Severity = 'critical' | 'warning' | 'info';

export interface DefectEvent {
    id: string;
    type: string;
    severity: Severity;
    line: string;
    camera: number;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
    timestamp: Date;
    product: string;
    environment: string;
}

export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: string;
    severity: Severity;
    confidence: number;
}

const DEFECT_TYPES = ['Crack', 'Scratch', 'Contamination', 'Misalignment', 'Missing Part', 'Dimensional', 'Blob', 'Burr', 'Pit', 'Delamination'];
const PRODUCT_LINES = ['Line A', 'Line B', 'Line C', 'Line D', 'Line E', 'Line F'];
const PRODUCTS_BY_ENV: Record<string, string[]> = {
    Automotive: ['Engine Block', 'Cylinder Head', 'Brake Disc', 'Transmission Housing', 'Control Arm'],
    Electronics: ['PCB Assembly', 'Display Panel', 'Battery Cell', 'Connector Module', 'Heat Sink'],
    Textile: ['Fabric Roll', 'Woven Panel', 'Yarn Bundle', 'Dye Lot', 'Stitched Seam'],
    Pharma: ['Tablet Blister', 'Capsule Strip', 'Vial Pack', 'Ampoule Set', 'Syringe Unit'],
};

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function genId() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }

export function generateDefectEvent(environment = 'Automotive'): DefectEvent {
    const severity: Severity = Math.random() < 0.15 ? 'critical' : Math.random() < 0.4 ? 'warning' : 'info';
    const products = PRODUCTS_BY_ENV[environment] ?? PRODUCTS_BY_ENV['Automotive']!;
    return {
        id: genId(),
        type: pick(DEFECT_TYPES),
        severity,
        line: pick(PRODUCT_LINES),
        camera: randInt(1, 4),
        confidence: Math.round(rand(72, 99.5) * 10) / 10,
        x: randInt(5, 55),
        y: randInt(5, 55),
        width: randInt(8, 28),
        height: randInt(6, 22),
        timestamp: new Date(),
        product: pick(products),
        environment,
    };
}

export function generateBoundingBoxes(count = 3): BoundingBox[] {
    return Array.from({ length: count }, () => ({
        id: genId(),
        x: rand(5, 65),
        y: rand(5, 65),
        w: rand(8, 25),
        h: rand(6, 20),
        type: pick(DEFECT_TYPES),
        severity: (Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'warning' : 'info') as Severity,
        confidence: Math.round(rand(72, 99) * 10) / 10,
    }));
}
