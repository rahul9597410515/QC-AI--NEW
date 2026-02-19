import { useState } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, Info, Bell, X, Eye } from 'lucide-react';
import { useSensorStream } from '../hooks/useLiveData';
import { useApp } from '../context/AppContext';

function SensorGauge({ name, value, min, max, unit, status }: {
    name: string; value: number; min: number; max: number; unit: string; status: string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    const color = status === 'critical' ? 'var(--accent-red)' : status === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-green)';
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const arc = circumference * 0.75; // 3/4 arc
    const offset = arc * (1 - pct / 100);

    return (
        <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <svg width={100} height={84} viewBox="0 0 100 84" style={{ display: 'block', margin: '0 auto' }}>
                {/* Track */}
                <circle cx={50} cy={54} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={8}
                    strokeDasharray={`${arc} ${circumference - arc}`} strokeDashoffset={arc * 0.375 + arc * 0.5}
                    strokeLinecap="round" transform="rotate(135 50 54)" />
                {/* Fill */}
                <circle cx={50} cy={54} r={radius} fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${arc - offset} ${circumference - (arc - offset)}`}
                    strokeDashoffset={arc * 0.375 + arc * 0.5}
                    strokeLinecap="round" transform="rotate(135 50 54)"
                    style={{ transition: 'stroke-dasharray 0.5s ease', filter: `drop-shadow(0 0 4px ${color})` }} />
                {/* Value */}
                <text x={50} y={52} textAnchor="middle" fill="var(--text-primary)" fontSize={13} fontFamily="var(--font-mono)" fontWeight={700}>
                    {value}
                </text>
                <text x={50} y={65} textAnchor="middle" fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-ui)">
                    {unit}
                </text>
            </svg>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{name}</div>
            <div style={{ fontSize: '0.65rem', color, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{status}</div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card" style={{ padding: '10px 14px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ fontSize: '0.75rem', color: p.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

const SENSOR_COLORS = ['#00D4FF', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#F97316'];

export default function SensorAlerts() {
    const { readings, history } = useSensorStream(2000);
    const { alerts, acknowledgeAlert, dismissAlert } = useApp();
    const [visibleSensors, setVisibleSensors] = useState<Record<string, boolean>>({
        temperature: true, vibration: true, pressure: false, humidity: false, speed: true, current: false
    });

    const chartData = history.slice(-30).map((snap, i) => ({
        t: i,
        temperature: snap.temperature,
        vibration: snap.vibration,
        pressure: snap.pressure,
        humidity: snap.humidity,
        speed: snap.speed,
        current: snap.current,
    }));

    const alertIcon = (severity: string) => {
        if (severity === 'critical') return <AlertTriangle size={14} color="var(--accent-red)" />;
        if (severity === 'warning') return <Bell size={14} color="var(--accent-yellow)" />;
        return <Info size={14} color="var(--accent-cyan)" />;
    };

    const alertBadgeClass = (s: string) => s === 'critical' ? 'badge-red' : s === 'warning' ? 'badge-yellow' : 'badge-cyan';

    return (
        <div className="animate-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Gauge Grid */}
            <div className="card">
                <div className="section-header">
                    <h3 className="section-title">Sensor Telemetry — Live</h3>
                    <div className="live-indicator"><span className="status-dot live" />LIVE</div>
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
                    {readings.map(r => <SensorGauge key={r.key} name={r.name} value={r.value} min={r.min} max={r.max} unit={r.unit} status={r.status} />)}
                </div>
            </div>

            {/* Time series + Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                {/* Time series */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Sensor Time Series</h3>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {readings.map((r, i) => (
                                <button
                                    key={r.key}
                                    className={`btn btn-sm ${visibleSensors[r.key] ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{
                                        fontSize: '0.7rem', padding: '3px 8px',
                                        background: visibleSensors[r.key] ? `${SENSOR_COLORS[i]}22` : undefined,
                                        color: visibleSensors[r.key] ? SENSOR_COLORS[i] : undefined,
                                        borderColor: visibleSensors[r.key] ? SENSOR_COLORS[i] : undefined
                                    }}
                                    onClick={() => setVisibleSensors(v => ({ ...v, [r.key]: !v[r.key] }))}
                                >
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,46,80,0.8)" />
                                <XAxis dataKey="t" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} hide />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                {readings.map((r, i) =>
                                    visibleSensors[r.key] ? (
                                        <Line key={r.key} type="monotone" dataKey={r.key} stroke={SENSOR_COLORS[i]}
                                            strokeWidth={1.5} dot={false} name={r.name} />
                                    ) : null
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alert Center */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header">
                        <h3 className="section-title"><AlertTriangle size={14} style={{ marginRight: 6 }} />Alert Center</h3>
                        <span className="badge badge-red">{alerts.filter(a => !a.acknowledged).length} Active</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {alerts.length === 0
                            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20, fontSize: '0.8rem' }}>No active alerts</p>
                            : alerts.map(alert => (
                                <div key={alert.id} className="alert-banner" style={{
                                    opacity: alert.acknowledged ? 0.5 : 1,
                                    padding: '10px 12px',
                                    flexDirection: 'column',
                                    gap: 6,
                                    background: alert.severity === 'critical' ? 'var(--accent-red-dim)' :
                                        alert.severity === 'warning' ? 'var(--accent-yellow-dim)' : 'var(--accent-cyan-dim)',
                                    border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.3)' :
                                        alert.severity === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(0,212,255,0.3)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    animation: 'alert-slide-down 0.3s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {alertIcon(alert.severity)}
                                        <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>{alert.message}</span>
                                        <button
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                                            onClick={() => dismissAlert(alert.id)}
                                        ><X size={12} /></button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className={`badge ${alertBadgeClass(alert.severity)}`}>{alert.severity}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{alert.source}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                            {alert.timestamp.toLocaleTimeString()}
                                        </span>
                                        {!alert.acknowledged && (
                                            <button className="btn btn-sm btn-ghost" style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                                onClick={() => acknowledgeAlert(alert.id)}>
                                                <Eye size={10} /> ACK
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
