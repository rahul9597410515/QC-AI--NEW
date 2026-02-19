import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import { generateDailyData, DEFECT_TYPES_BREAKDOWN, generateHeatmapData } from '../data/historicalData';

const RANGES = ['Today', '7D', '30D'];

function QualityGauge({ value }: { value: number }) {
    const radius = 60;
    const circumference = Math.PI * radius;
    const offset = circumference * (1 - value / 100);
    return (
        <div style={{ textAlign: 'center' }}>
            <svg width={160} height={90} viewBox="0 0 160 90">
                <path d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`} fill="none" stroke="var(--bg-tertiary)" strokeWidth={12} strokeLinecap="round" />
                <path
                    d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`}
                    fill="none"
                    stroke={value > 97 ? 'var(--accent-green)' : value > 93 ? 'var(--accent-yellow)' : 'var(--accent-red)'}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 6px var(--accent-cyan))' }}
                />
                <text x={80} y={75} textAnchor="middle" fill="var(--text-primary)" fontSize={20} fontFamily="var(--font-mono)" fontWeight={700}>
                    {value}%
                </text>
                <text x={80} y={88} textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-ui)">QUALITY SCORE</text>
            </svg>
        </div>
    );
}

function HeatmapGrid({ data }: { data: number[][] }) {
    const getColor = (v: number) => {
        if (v < 15) return 'rgba(16,185,129,0.15)';
        if (v < 35) return 'rgba(245,158,11,0.25)';
        if (v < 60) return 'rgba(239,68,68,0.35)';
        return 'rgba(239,68,68,0.7)';
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, width: '100%' }}>
            {data.flat().map((v, i) => (
                <div
                    key={i}
                    title={`Zone ${Math.floor(i / 10) + 1}-${(i % 10) + 1}: ${v}%`}
                    style={{
                        aspectRatio: '1',
                        borderRadius: 3,
                        background: getColor(v),
                        border: '1px solid rgba(30,46,80,0.4)',
                        transition: 'opacity 0.3s ease',
                        cursor: 'default',
                    }}
                />
            ))}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ fontSize: '0.8rem', color: p.color || 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

export default function DefectAnalytics() {
    const [range, setRange] = useState('30D');
    const [dailyData] = useState(() => generateDailyData(30));
    const days = range === 'Today' ? 1 : range === '7D' ? 7 : 30;
    const sliced = dailyData.slice(-days);
    const qualityScore = Math.round(sliced.reduce((s, d) => s + d.quality, 0) / sliced.length * 10) / 10;

    // Scale defect counts based on range
    const defectBreakdown = DEFECT_TYPES_BREAKDOWN.map(d => ({
        ...d,
        count: Math.round(d.count * (days / 30) * (0.9 + Math.random() * 0.2)) // Add some variance
    }));

    // Regenerate heatmap slightly different for each range
    const [heatmap, setHeatmap] = useState(() => generateHeatmapData());



    // Effect to update heatmap when range changes
    useEffect(() => {
        setHeatmap(generateHeatmapData());
    }, [range]);

    function downloadCSV() {
        const headers = ['Date', 'Inspections', 'Defects', 'Defect Rate', 'Quality'];
        const rows = sliced.map(d => [d.date, d.inspections, d.defects, d.defectRate, d.quality].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `qc-analytics-${range}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Defect Analytics</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Comprehensive quality intelligence across all production lines</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div className="tabs">
                        {RANGES.map(r => (
                            <button key={r} className={`tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
                        ))}
                    </div>
                    <button className="btn btn-secondary" onClick={downloadCSV}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 20 }}>
                {/* Line Chart */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title"><TrendingUp size={14} style={{ marginRight: 6 }} />Defect Rate Over Time</h3>
                    </div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sliced} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,46,80,0.8)" />
                                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false}
                                    interval={Math.max(0, Math.floor(sliced.length / 6) - 1)} />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="defectRate" stroke="#EF4444" strokeWidth={2} dot={false} name="Defect Rate %" />
                                <Line type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} dot={false} name="Quality %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie / bar combo */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Defect Type Breakdown</h3>
                    </div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={defectBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                                    {defectBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quality Gauge */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <h3 className="section-title">Quality Score</h3>
                    <QualityGauge value={qualityScore} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Period: <span style={{ color: 'var(--text-secondary)' }}>{range}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Target: <span style={{ color: 'var(--accent-green)' }}>98.0%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Heatmap */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Defect Zone Heatmap</h3>
                        <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            <span>● Low</span><span style={{ color: 'var(--accent-yellow)' }}>● Medium</span><span style={{ color: 'var(--accent-red)' }}>● High</span>
                        </div>
                    </div>
                    <HeatmapGrid data={heatmap} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
                        Product surface divided into 10×10 inspection zones
                    </p>
                </div>

                {/* Defect type pie */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Defect Distribution</h3>
                    </div>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={defectBreakdown} dataKey="count" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={48}>
                                    {defectBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{value}</span>}
                                />
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
