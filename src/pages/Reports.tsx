import { useState } from 'react';
import { FileText, Download, Calendar, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import { generateDailyData } from '../data/historicalData';

const TEMPLATES = [
    { id: 'daily', label: 'Daily Summary', icon: '📊', desc: 'Overview of all production lines for the day' },
    { id: 'defect', label: 'Defect Breakdown', icon: '🔍', desc: 'Detailed defect types and root cause analysis' },
    { id: 'shift', label: 'Shift Report', icon: '⏱️', desc: 'Per-shift quality metrics and operator performance' },
    { id: 'compliance', label: 'Compliance Report', icon: '✅', desc: 'ISO/QA compliance summary for audit trail' },
];

const SHIFTS = ['All Shifts', 'Morning (6AM–2PM)', 'Afternoon (2PM–10PM)', 'Night (10PM–6AM)'];

function ReportPreview({ template, range, shift }: { template: string; range: string; shift: string }) {
    const data = generateDailyData(7);
    const totalInspections = data.reduce((s, d) => s + d.inspections, 0);
    const totalDefects = data.reduce((s, d) => s + d.defects, 0);
    const avgQuality = Math.round(data.reduce((s, d) => s + d.quality, 0) / data.length * 10) / 10;
    const defectRate = Math.round((totalDefects / totalInspections) * 1000) / 10;

    return (
        <div style={{ padding: 20, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            {/* Report Header */}
            <div style={{ borderBottom: '2px solid var(--accent-cyan)', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', marginBottom: 4 }}>
                            QC AI — {TEMPLATES.find(t => t.id === template)?.label || 'Report'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Generated: {new Date().toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Period: <span style={{ color: 'var(--text-secondary)' }}>{range}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shift: <span style={{ color: 'var(--text-secondary)' }}>{shift}</span></div>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
                {[
                    { label: 'Total Inspections', value: totalInspections.toLocaleString(), color: 'var(--accent-cyan)' },
                    { label: 'Total Defects', value: totalDefects.toLocaleString(), color: 'var(--accent-red)' },
                    { label: 'Defect Rate', value: `${defectRate}%`, color: 'var(--accent-yellow)' },
                    { label: 'Avg Quality', value: `${avgQuality}%`, color: 'var(--accent-green)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Table preview */}
            <table className="table">
                <thead>
                    <tr><th>Date</th><th>Inspections</th><th>Defects</th><th>Defect Rate</th><th>Quality</th></tr>
                </thead>
                <tbody>
                    {data.slice(0, 5).map(d => (
                        <tr key={d.date}>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{d.date}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{d.inspections.toLocaleString()}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: d.defects > 60 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{d.defects}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: d.defectRate > 2 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{d.defectRate}%</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                                        <div className={`progress-fill ${d.quality > 97 ? 'green' : d.quality > 93 ? 'yellow' : 'red'}`} style={{ width: `${d.quality}%` }} />
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minWidth: 36 }}>{d.quality}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 10 }}>Showing 5 of {data.length} entries</p>
        </div>
    );
}

export default function Reports() {
    const [selectedTemplate, setSelectedTemplate] = useState('daily');
    const [selectedRange, setSelectedRange] = useState('Last 7 Days');
    const [selectedShift, setSelectedShift] = useState('All Shifts');
    const [scheduled, setScheduled] = useState({ daily: true, weekly: false });

    function downloadPDF() {
        const printStyle = document.createElement('style');
        printStyle.innerHTML = `@media print { .sidebar, .topbar, .reports-controls { display: none !important; } }`;
        document.head.appendChild(printStyle);
        window.print();
        document.head.removeChild(printStyle);
    }

    function downloadCSV() {
        const data = generateDailyData(7);
        const headers = ['Date', 'Inspections', 'Defects', 'Defect Rate', 'Quality'];
        const rows = data.map(d => [d.date, d.inspections, d.defects, d.defectRate, d.quality].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `qc-report-${selectedTemplate}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {/* Main area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Report templates */}
                    <div className="card reports-controls">
                        <h3 className="section-title" style={{ marginBottom: 14 }}>Report Templates</h3>
                        <div className="grid-2" style={{ gap: 10 }}>
                            {TEMPLATES.map(t => (
                                <div
                                    key={t.id}
                                    className={`card${selectedTemplate === t.id ? ' card-cyan' : ''}`}
                                    style={{ padding: '14px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                                    onClick={() => setSelectedTemplate(t.id)}
                                >
                                    <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, color: selectedTemplate === t.id ? 'var(--accent-cyan)' : 'var(--text-primary)', fontSize: '0.875rem' }}>{t.label}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 3, lineHeight: 1.4 }}>{t.desc}</p>
                                    </div>
                                    {selectedTemplate === t.id && <ChevronRight size={14} color="var(--accent-cyan)" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Report Preview */}
                    <div className="card">
                        <div className="section-header">
                            <h3 className="section-title"><FileText size={14} style={{ marginRight: 6 }} />Report Preview</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}><Download size={12} /> CSV</button>
                                <button className="btn btn-primary btn-sm" onClick={downloadPDF}><Download size={12} /> PDF</button>
                            </div>
                        </div>
                        <ReportPreview template={selectedTemplate} range={selectedRange} shift={selectedShift} />
                    </div>
                </div>

                {/* Sidebar panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Filters */}
                    <div className="card reports-controls">
                        <h3 className="section-title" style={{ marginBottom: 14 }}>
                            <Calendar size={14} style={{ marginRight: 6 }} />Report Filters
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date Range</label>
                                <select className="select" style={{ width: '100%' }} value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
                                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month'].map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Shift</label>
                                <select className="select" style={{ width: '100%' }} value={selectedShift} onChange={e => setSelectedShift(e.target.value)}>
                                    {SHIFTS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled */}
                    <div className="card reports-controls">
                        <h3 className="section-title" style={{ marginBottom: 14 }}>
                            <RefreshCw size={14} style={{ marginRight: 6 }} />Scheduled Reports
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { key: 'daily', label: 'Daily Auto-Report', desc: 'Every day at 11:59 PM' },
                                { key: 'weekly', label: 'Weekly Summary', desc: 'Every Sunday at midnight' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{label}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
                                    </div>
                                    <label className="toggle">
                                        <input type="checkbox" checked={scheduled[key as keyof typeof scheduled]}
                                            onChange={() => setScheduled(s => ({ ...s, [key]: !s[key as keyof typeof s] }))} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="card">
                        <h3 className="section-title" style={{ marginBottom: 12 }}>
                            <Clock size={14} style={{ marginRight: 6 }} />Quick Stats
                        </h3>
                        {[
                            { label: 'Reports Generated (MTD)', value: '47' },
                            { label: 'Avg. Quality Score', value: '97.2%' },
                            { label: 'Defect Trend', value: '↓ 12%' },
                            { label: 'Compliance Rate', value: '99.1%' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,46,80,0.5)' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
