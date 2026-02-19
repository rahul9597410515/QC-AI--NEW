import { useState } from 'react';
import { Plus, Trash2, ChevronRight, Cpu, Camera, Bell, Sliders } from 'lucide-react';
import { useApp, PRODUCTS_BY_ENV } from '../context/AppContext';
import type { Environment } from '../context/AppContext';

const ENV_DESCRIPTIONS: Record<Environment, string> = {
    Automotive: 'Vehicle parts, chassis, engine components with tight tolerances',
    Electronics: 'PCBs, displays, batteries with micro-scale defect detection',
    Textile: 'Fabric weave inspection, pattern alignment, color consistency',
    Pharma: 'Pharmaceutical packaging, fill levels, seal integrity checks',
};

const ENV_ICONS: Record<Environment, string> = {
    Automotive: '🚗', Electronics: '🔌', Textile: '🧵', Pharma: '💊',
};

const ENVIRONMENTS: Environment[] = ['Automotive', 'Electronics', 'Textile', 'Pharma'];

const DEFAULT_DEFECT_CLASSES = ['Crack', 'Scratch', 'Contamination', 'Misalignment', 'Missing Part', 'Dimensional'];

export default function Configuration() {
    const { environment, setEnvironment, productType, setProductType } = useApp();
    const [sensitivity, setSensitivity] = useState<Record<string, number>>({
        Global: 75, Crack: 80, Scratch: 70, Contamination: 85, Misalignment: 72, 'Missing Part': 90, Dimensional: 68
    });
    const [defectClasses, setDefectClasses] = useState(DEFAULT_DEFECT_CLASSES);
    const [newClass, setNewClass] = useState('');
    const [cameras, setCameras] = useState([
        { id: 1, res: '4K', fps: 30, fov: 90 },
        { id: 2, res: '2K', fps: 60, fov: 75 },
        { id: 3, res: '4K', fps: 30, fov: 110 },
        { id: 4, res: '1080p', fps: 120, fov: 60 },
    ]);
    const [notifs, setNotifs] = useState({ email: true, inApp: true, webhook: false, critical: true, warning: true, info: false });
    const [activeSection, setActiveSection] = useState<'environment' | 'defects' | 'cameras' | 'notifications'>('environment');

    const addDefectClass = () => {
        if (newClass.trim() && !defectClasses.includes(newClass.trim())) {
            setDefectClasses(c => [...c, newClass.trim()]);
            setNewClass('');
        }
    };

    return (
        <div className="animate-page" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
            {/* Nav sidebar */}
            <div className="card" style={{ height: 'fit-content' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Configuration</p>
                {[
                    { key: 'environment', label: 'Environments', icon: Cpu },
                    { key: 'defects', label: 'Defect Classes', icon: Sliders },
                    { key: 'cameras', label: 'Camera Config', icon: Camera },
                    { key: 'notifications', label: 'Notifications', icon: Bell },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key as any)}
                        className={`nav-item${activeSection === key ? ' active' : ''}`}
                        style={{ width: '100%', justifyContent: 'flex-start', border: 'none', cursor: 'pointer' }}
                    >
                        <Icon size={14} className="nav-icon" />
                        {label}
                        <ChevronRight size={12} className="nav-chevron" style={{ marginLeft: 'auto' }} />
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {/* Environment Profiles */}
                {activeSection === 'environment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card">
                            <h3 className="section-title" style={{ marginBottom: 16 }}>Manufacturing Environment Profiles</h3>
                            <div className="grid-2" style={{ gap: 14 }}>
                                {ENVIRONMENTS.map(env => (
                                    <div
                                        key={env}
                                        className={`card${env === environment ? ' card-cyan' : ''}`}
                                        style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        onClick={() => setEnvironment(env)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: '1.5rem' }}>{ENV_ICONS[env]}</span>
                                                <span style={{ fontWeight: 700, color: env === environment ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{env}</span>
                                            </div>
                                            {env === environment && <span className="badge badge-cyan">ACTIVE</span>}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ENV_DESCRIPTIONS[env]}</p>
                                        <div style={{ marginTop: 12 }}>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6 }}>Products:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {(PRODUCTS_BY_ENV[env] || []).map(p => (
                                                    <span key={p} className={`badge ${p === productType && env === environment ? 'badge-cyan' : 'badge-gray'}`}
                                                        style={{ cursor: 'pointer', fontSize: '0.62rem' }}
                                                        onClick={(e) => { e.stopPropagation(); if (env === environment) setProductType(p); }}>
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Model Info */}
                        <div className="card card-cyan">
                            <h3 className="section-title" style={{ marginBottom: 14 }}>
                                <Cpu size={14} style={{ marginRight: 6 }} />AI Model Info
                            </h3>
                            <div className="grid-2" style={{ gap: 12 }}>
                                {[
                                    { label: 'Model', value: 'QC-Vision v3.2' },
                                    { label: 'Last Trained', value: 'Feb 15, 2026' },
                                    { label: 'Accuracy', value: '97.8%' },
                                    { label: 'Defect Classes', value: defectClasses.length.toString() },
                                    { label: 'Environments', value: '4' },
                                    { label: 'Framework', value: 'YOLO v11 + ResNet' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Defect Classes */}
                {activeSection === 'defects' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card">
                            <h3 className="section-title" style={{ marginBottom: 16 }}>Defect Class Editor</h3>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <input className="input" placeholder="New defect class name..." value={newClass} onChange={e => setNewClass(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addDefectClass()} style={{ flex: 1 }} />
                                <button className="btn btn-primary" onClick={addDefectClass}><Plus size={14} /> Add</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {defectClasses.map(cls => (
                                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                        <span className="badge badge-purple">CLASS</span>
                                        <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)' }}>{cls}</span>
                                        <div style={{ width: 180, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sensitivity</span>
                                            <input type="range" min={0} max={100} value={sensitivity[cls] ?? 75}
                                                onChange={e => setSensitivity(s => ({ ...s, [cls]: +e.target.value }))} style={{ flex: 1 }} />
                                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', minWidth: 28 }}>{sensitivity[cls] ?? 75}%</span>
                                        </div>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                            onClick={() => setDefectClasses(c => c.filter(x => x !== cls))}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Camera Config */}
                {activeSection === 'cameras' && (
                    <div className="card">
                        <h3 className="section-title" style={{ marginBottom: 16 }}>Camera Configuration</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {cameras.map((cam, i) => (
                                <div key={cam.id} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <Camera size={16} color="var(--accent-cyan)" />
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Camera {cam.id}</span>
                                        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>ONLINE</span>
                                    </div>
                                    <div className="grid-3" style={{ gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Resolution</label>
                                            <select className="select" style={{ width: '100%' }} value={cam.res}
                                                onChange={e => setCameras(cs => cs.map((c, j) => j === i ? { ...c, res: e.target.value } : c))}>
                                                {['1080p', '2K', '4K'].map(r => <option key={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Frame Rate</label>
                                            <select className="select" style={{ width: '100%' }} value={cam.fps}
                                                onChange={e => setCameras(cs => cs.map((c, j) => j === i ? { ...c, fps: +e.target.value } : c))}>
                                                {[24, 30, 60, 120].map(r => <option key={r}>{r} FPS</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Field of View</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input type="range" min={40} max={150} value={cam.fov}
                                                    onChange={e => setCameras(cs => cs.map((c, j) => j === i ? { ...c, fov: +e.target.value } : c))} />
                                                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', minWidth: 36 }}>{cam.fov}°</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {activeSection === 'notifications' && (
                    <div className="card">
                        <h3 className="section-title" style={{ marginBottom: 16 }}>Notification Settings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Channels</p>
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive defect alerts via email' },
                                { key: 'inApp', label: 'In-App Notifications', desc: 'Show notifications in dashboard' },
                                { key: 'webhook', label: 'Webhook Integration', desc: 'POST alerts to external endpoint' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{label}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{desc}</p>
                                    </div>
                                    <label className="toggle">
                                        <input type="checkbox" checked={notifs[key as keyof typeof notifs] as boolean}
                                            onChange={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            ))}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>Alert Levels</p>
                            {[
                                { key: 'critical', label: 'Critical Alerts', color: 'var(--accent-red)' },
                                { key: 'warning', label: 'Warning Alerts', color: 'var(--accent-yellow)' },
                                { key: 'info', label: 'Info Alerts', color: 'var(--accent-cyan)' },
                            ].map(({ key, label, color }) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 600, color, fontSize: '0.875rem' }}>{label}</span>
                                    <label className="toggle">
                                        <input type="checkbox" checked={notifs[key as keyof typeof notifs] as boolean}
                                            onChange={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
