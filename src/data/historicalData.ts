// ============================================
// QC AI — Historical Data (pre-generated for charts)
// ============================================

export interface HourlyDefect {
    hour: string;
    defects: number;
    inspections: number;
    defectRate: number;
    lineA: number;
    lineB: number;
    lineC: number;
}

export interface DailyData {
    date: string;
    defects: number;
    inspections: number;
    defectRate: number;
    passRate: number;
    quality: number;
}

export interface DefectTypeData {
    name: string;
    count: number;
    percentage: number;
    color: string;
}

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 24-hour data for defect trend chart
export function generateHourlyData(): HourlyDefect[] {
    return Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0') + ':00';
        const inspections = randInt(80, 250);
        const defectRateRaw = 1.5 + Math.sin(i * 0.4) * 1.2 + Math.random() * 0.8;
        const defects = Math.round(inspections * defectRateRaw / 100);
        return {
            hour,
            defects,
            inspections,
            defectRate: Math.round(defectRateRaw * 10) / 10,
            lineA: Math.round(defects * 0.35 + Math.random() * 3),
            lineB: Math.round(defects * 0.28 + Math.random() * 3),
            lineC: Math.round(defects * 0.22 + Math.random() * 3),
        };
    });
}

// 30-day data
export function generateDailyData(days = 30): DailyData[] {
    const result: DailyData[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const inspections = randInt(1200, 3800);
        const defectRate = 1.2 + Math.sin(i * 0.3) * 0.8 + Math.random() * 0.5;
        const defects = Math.round(inspections * defectRate / 100);
        const quality = Math.round((100 - defectRate) * 10) / 10;
        result.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            defects,
            inspections,
            defectRate: Math.round(defectRate * 10) / 10,
            passRate: Math.round((100 - defectRate) * 10) / 10,
            quality,
        });
    }
    return result;
}

// Defect type breakdown
export const DEFECT_TYPES_BREAKDOWN: DefectTypeData[] = [
    { name: 'Scratch', count: 412, percentage: 28.5, color: '#F59E0B' },
    { name: 'Crack', count: 298, percentage: 20.6, color: '#EF4444' },
    { name: 'Contamination', count: 234, percentage: 16.2, color: '#7C3AED' },
    { name: 'Misalignment', count: 187, percentage: 12.9, color: '#00D4FF' },
    { name: 'Missing Part', count: 143, percentage: 9.9, color: '#F97316' },
    { name: 'Dimensional', count: 98, percentage: 6.8, color: '#10B981' },
    { name: 'Other', count: 74, percentage: 5.1, color: '#94A3B8' },
];

// Heatmap grid (10x10 zones, 0–100 intensity)
export function generateHeatmapData(): number[][] {
    return Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => {
            // Concentrate defects in center and edges
            const distFromCenter = Math.sqrt(Math.pow(row - 4.5, 2) + Math.pow(col - 4.5, 2));
            const base = Math.max(0, 80 - distFromCenter * 15);
            return Math.round(Math.max(0, Math.min(100, base + (Math.random() - 0.5) * 30)));
        })
    );
}
