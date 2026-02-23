import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, CheckCircle, Eye, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { useApp, PRODUCTS_BY_ENV } from '../context/AppContext';
import type { Environment } from '../context/AppContext';
import { useSimulatedFeed } from '../hooks/useLiveData';
import { INITIAL_LINES, updateLines } from '../data/productionLines';
import type { ProductionLine } from '../data/productionLines';
import { useAuth } from '../context/AuthContext';
import { generateHourlyData } from '../data/historicalData';
import type { DefectEvent, Severity } from '../data/defectStream';

const ENVIRONMENTS: Environment[] = ['Automotive', 'Electronics', 'Textile', 'Pharma'];

function timeAgo(d: Date | null) {
    if (!d) return '—';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
}

function SeverityBadge({ s }: { s: Severity }) {
    const cls = s === 'critical' ? 'badge-red' : s === 'warning' ? 'badge-yellow' : 'badge-cyan';
    return <span className={`badge ${cls}`}>{s}</span>;
}

function KpiCard({ label, value, unit, icon: Icon, color, sub }: {
    label: string; value: number | string; unit?: string; icon: any; color: string; sub?: string;
}) {
    return (
        <div className={`card kpi-card card-${color}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-secondary text-sm">{label}</span>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `var(--accent-${color}-dim)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: `var(--accent-${color})`
                }}>
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <div className="kpi-value animate-count-up" style={{ color: `var(--accent-${color})` }}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {unit && <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
                </div>
                {sub && <div className="text-secondary text-xs" style={{ marginTop: 4 }}>{sub}</div>}
            </div>
        </div>
    );
}

function LineCard({ line }: { line: ProductionLine }) {
    const statusColor = line.status === 'running' ? 'green' : line.status === 'warning' ? 'yellow' : line.status === 'stopped' ? 'red' : 'gray';
    const statusDot = line.status === 'running' ? 'live' : line.status === 'warning' ? 'warning' : line.status === 'stopped' ? 'error' : 'offline';
    return (
        <div className={`card card-${statusColor}`} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{line.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`status-dot ${statusDot}`} />
                    <span className={`badge badge-${statusColor}`}>{line.status.toUpperCase()}</span>
                </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{line.product}</div>
            <div className="grid-2" style={{ gap: 8 }}>
                <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Throughput</div>
                    <div className="mono text-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{line.throughput} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>u/hr</span></div>
                </div>
                <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Defect Rate</div>
                    <div className="mono text-sm" style={{ color: line.defectRate > 3 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600 }}>{line.defectRate}%</div>
                </div>
            </div>
            <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pass Rate</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{line.passRate}%</span>
                </div>
                <div className="progress-bar">
                    <div className={`progress-fill ${line.passRate > 97 ? 'green' : line.passRate > 93 ? 'yellow' : 'red'}`} style={{ width: `${line.passRate}%` }} />
                </div>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                Last defect: <span style={{ color: 'var(--text-secondary)' }}>{timeAgo(line.lastDefect)}</span>
            </div>
        </div>
    );
}

function DefectFeedItem({ d }: { d: DefectEvent }) {
    return (
        <div className="defect-feed-item animate-fade-in" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
            borderBottom: '1px solid var(--border)', animation: 'feed-slide-in 0.3s ease both'
        }}>
            <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: d.severity === 'critical' ? 'var(--accent-red-dim)' : d.severity === 'warning' ? 'var(--accent-yellow-dim)' : 'var(--accent-cyan-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: d.severity === 'critical' ? 'var(--accent-red)' : d.severity === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-cyan)',
                fontSize: '0.7rem', fontWeight: 700
            }}>
                {d.type[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.type}</span>
                    <SeverityBadge s={d.severity} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {d.line} · Cam {d.camera} · {d.confidence}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {d.timestamp.toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card" style={{ padding: '10px 14px', minWidth: 150 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ fontSize: '0.8rem', color: p.color, fontFamily: 'var(--font-mono)' }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const { environment, setEnvironment, productType, setProductType, recentDefects, totalInspections, alerts } = useApp();
    const [lines, setLines] = useState<ProductionLine[]>(INITIAL_LINES);
    const [hourlyData] = useState(() => generateHourlyData());
    useSimulatedFeed();
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const defectRate = lines.filter(l => l.status !== 'idle').reduce((sum, l) => sum + l.defectRate, 0) / Math.max(1, lines.filter(l => l.status !== 'idle').length);
    const passRate = Math.round((100 - defectRate) * 10) / 10;

    // Update line data every 3 seconds
    useEffect(() => {
        const id = setInterval(() => setLines(prev => updateLines(prev)), 3000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="animate-page">
            {/* KPI Row */}
            {user && (
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{user.email.split('@')[0]}</span>
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Here's the realtime production overview for {new Date().toLocaleDateString()}</p>
                </div>
            )}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                <KpiCard label="Total Inspections" value={totalInspections} icon={Eye} color="cyan" sub="Today across all lines" />
                <KpiCard label="Defect Rate" value={defectRate.toFixed(1)} unit="%" icon={TrendingDown} color="yellow" sub="Avg. across active lines" />
                <KpiCard label="Pass Rate" value={passRate} unit="%" icon={CheckCircle} color="green" sub="Quality target: 98%" />
                <KpiCard label="Active Alerts" value={criticalAlerts} icon={AlertTriangle} color="red" sub={`${alerts.filter(a => !a.acknowledged).length} unacknowledged`} />
            </div>

            {/* Main row: Trend + Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
                {/* Defect Trend */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <div className="section-title-icon"><Activity size={14} /></div>
                            Defect Trend — Last 24 Hours
                        </h3>
                        <div className="live-indicator">
                            <span className="status-dot live" />
                            LIVE
                        </div>
                    </div>
                    <div className="chart-container" style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,46,80,0.8)" />
                                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="defects" stroke="#00D4FF" strokeWidth={2} fill="url(#grad-cyan)" dot={false} name="Defects" />
                                <Area type="monotone" dataKey="lineA" stroke="#EF4444" strokeWidth={1.5} fill="url(#grad-red)" dot={false} name="Line A" opacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Defect Feed */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header">
                        <h3 className="section-title">Live Defect Feed</h3>
                        <div className="live-indicator">
                            <span className="status-dot live" />
                            LIVE
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 260 }}>
                        {recentDefects.length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', paddingTop: 24 }}>No defects detected yet</p>
                            : recentDefects.slice(0, 12).map(d => <DefectFeedItem key={d.id} d={d} />)
                        }
                    </div>
                </div>
            </div>

            {/* Bottom row: Line Grid + Env Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                {/* Production Lines */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <div className="section-title-icon"><RefreshCw size={14} /></div>
                            Production Line Status
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lines.filter(l => l.status === 'running').length} active</span>
                    </div>
                    <div className="grid-3" style={{ gap: 12 }}>
                        {lines.map(line => <LineCard key={line.id} line={line} />)}
                    </div>
                </div>

                {/* Environment Selector */}
                <div className="card">
                    <div className="section-header" style={{ marginBottom: 14 }}>
                        <h3 className="section-title">Environment</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {ENVIRONMENTS.map(env => (
                            <button
                                key={env}
                                onClick={() => setEnvironment(env)}
                                className={`btn ${env === environment ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ justifyContent: 'flex-start', width: '100%', textAlign: 'left' }}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Product Type</p>
                        <select
                            className="select"
                            style={{ width: '100%' }}
                            value={productType}
                            onChange={e => setProductType(e.target.value)}
                        >
                            {(PRODUCTS_BY_ENV[environment] || []).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
