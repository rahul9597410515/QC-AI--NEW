// ============================================
// QC AI — Defect Stream Data Generator
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
}

const DEFECT_TYPES = ['Crack', 'Scratch', 'Contamination', 'Misalignment', 'Missing Part', 'Dimensional', 'Blob', 'Burr', 'Pit', 'Delamination'];
const PRODUCT_LINES = ['Line A', 'Line B', 'Line C', 'Line D', 'Line E', 'Line F'];
const PRODUCTS_BY_ENV: Record<string, string[]> = {
    Automotive: ['Engine Block', 'Cylinder Head', 'Brake Disc', 'Transmission Housing', 'Control Arm'],
    Electronics: ['PCB Assembly', 'Display Panel', 'Battery Cell', 'Connector Module', 'Heat Sink'],
    Textile: ['Fabric Roll', 'Woven Panel', 'Yarn Bundle', 'Dye Lot', 'Stitched Seam'],
    Pharma: ['Tablet Blister', 'Capsule Strip', 'Vial Pack', 'Ampoule Set', 'Syringe Unit'],
};

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
    return Math.floor(randomBetween(min, max + 1));
}

function randomChoice<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

function genId() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function generateDefectEvent(environment = 'Automotive'): DefectEvent {
    const severity: Severity = Math.random() < 0.15 ? 'critical' : Math.random() < 0.4 ? 'warning' : 'info';
    const products = PRODUCTS_BY_ENV[environment] || PRODUCTS_BY_ENV['Automotive'];
    return {
        id: genId(),
        type: randomChoice(DEFECT_TYPES),
        severity,
        line: randomChoice(PRODUCT_LINES),
        camera: randomInt(1, 4),
        confidence: Math.round(randomBetween(72, 99.5) * 10) / 10,
        x: randomInt(5, 55),
        y: randomInt(5, 55),
        width: randomInt(8, 28),
        height: randomInt(6, 22),
        timestamp: new Date(),
        product: randomChoice(products),
    };
}

// Generate multiple bounding boxes for live canvas
export interface BoundingBox {
    id: string;
    x: number; // percent
    y: number;
    w: number;
    h: number;
    type: string;
    severity: Severity;
    confidence: number;
    age: number; // frames to live
}

export function generateBoundingBoxes(count = 3): BoundingBox[] {
    return Array.from({ length: count }, () => ({
        id: genId(),
        x: randomBetween(5, 65),
        y: randomBetween(5, 65),
        w: randomBetween(8, 25),
        h: randomBetween(6, 20),
        type: randomChoice(DEFECT_TYPES),
        severity: (Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'warning' : 'info') as Severity,
        confidence: Math.round(randomBetween(72, 99) * 10) / 10,
        age: randomInt(20, 60),
    }));
}
