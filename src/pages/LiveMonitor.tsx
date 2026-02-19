import { useRef, useState, useEffect } from 'react';
import { Camera, Play, Pause, SlidersHorizontal, List, Clock } from 'lucide-react';
import { useLiveCanvas } from '../hooks/useLiveData';
import { useApp } from '../context/AppContext';
import type { BoundingBox, Severity } from '../data/defectStream';

const CAMERAS = [1, 2, 3, 4];

function BBoxOverlay({ box }: { box: BoundingBox }) {
    const color = box.severity === 'critical' ? '#EF4444' : box.severity === 'warning' ? '#F59E0B' : '#00D4FF';
    return (
        <div
            style={{
                position: 'absolute',
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
                border: `2px solid ${color}`,
                borderRadius: 4,
                boxShadow: `0 0 10px ${color}55`,
                animation: 'bbox-appear 0.3s ease',
                pointerEvents: 'none',
            }}
        >
            <div style={{
                position: 'absolute',
                top: -22,
                left: 0,
                background: color,
                color: box.severity === 'warning' ? '#000' : '#fff',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '3px 3px 3px 0',
                whiteSpace: 'nowrap',
            }}>
                {box.type} {box.confidence}%
            </div>
            {/* Corner marks */}
            {[['0%', '0%'], ['100%', '0%'], ['0%', '100%'], ['100%', '100%']].map(([x, y], i) => (
                <div key={i} style={{ position: 'absolute', left: x, top: y, width: 6, height: 6, background: color, margin: '-3px' }} />
            ))}
        </div>
    );
}

export default function LiveMonitor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [camera, setCamera] = useState(1);
    const [paused, setPaused] = useState(false);
    const [sensitivity, setSensitivity] = useState(75);
    const [defectFilter, setDefectFilter] = useState({ Crack: true, Scratch: true, Contamination: true, Misalignment: true, Other: true });
    const [sessionLog, setSessionLog] = useState<{ time: string; type: string; severity: Severity; conf: number }[]>([]);
    const { inspectionsPaused } = useApp();

    const boxes = useLiveCanvas(canvasRef, camera);
    const [fps] = useState(24);
    const [latency] = useState(() => Math.floor(Math.random() * 15) + 8);
    const [wrapSize, setWrapSize] = useState({ w: 600, h: 400 });

    useEffect(() => {
        if (!wrapRef.current) return;
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setWrapSize({ w: Math.floor(width), h: Math.floor(height) });
        });
        ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);

    // Log detections
    useEffect(() => {
        if (paused || inspectionsPaused) return;
        if (boxes.length > 0) {
            boxes.forEach(b => {
                setSessionLog(prev => [{
                    time: new Date().toLocaleTimeString(),
                    type: b.type,
                    severity: b.severity,
                    conf: b.confidence
                }, ...prev.slice(0, 99)]);
            });
        }
    }, [boxes, paused, inspectionsPaused]);

    return (
        <div className="animate-page" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, height: '100%' }}>
            {/* Main feed column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Camera tabs */}
                <div className="card" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="tabs">
                            {CAMERAS.map(c => (
                                <button key={c} className={`tab${camera === c ? ' active' : ''}`} onClick={() => setCamera(c)}>
                                    <Camera size={12} style={{ marginRight: 4 }} />CAM {c}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => setPaused(p => !p)}>
                                {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Freeze</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas / Feed */}
                <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', minHeight: 380 }}>
                    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 380 }}>
                        <canvas
                            ref={canvasRef}
                            width={wrapSize.w}
                            height={wrapSize.h}
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                        {/* Bounding boxes overlay */}
                        {!paused && boxes.map(box => (
                            <BBoxOverlay key={box.id} box={box} />
                        ))}
                        {/* Status overlay */}
                        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
                            <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--accent-green)' }}>●</span>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>CAM {camera} — LIVE</span>
                            </div>
                            <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {fps} FPS · {latency}ms
                            </div>
                        </div>
                        {paused && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Pause size={48} color="var(--accent-cyan)" />
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Feed Frozen</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats bar */}
                <div className="card" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {[
                            { label: 'FPS', value: fps.toString(), color: 'var(--accent-cyan)' },
                            { label: 'Latency', value: `${latency}ms`, color: 'var(--accent-green)' },
                            { label: 'Detections', value: sessionLog.length.toString(), color: 'var(--accent-yellow)' },
                            { label: 'Active Boxes', value: boxes.length.toString(), color: 'var(--accent-red)' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Controls */}
                <div className="card">
                    <div className="section-header" style={{ marginBottom: 14 }}>
                        <h3 className="section-title"><SlidersHorizontal size={14} style={{ marginRight: 6 }} />Detection Controls</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sensitivity</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{sensitivity}%</span>
                            </div>
                            <input type="range" min={0} max={100} value={sensitivity} onChange={e => setSensitivity(+e.target.value)} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Defect Classes</p>
                            {Object.entries(defectFilter).map(([key, val]) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={val} onChange={() => setDefectFilter(f => ({ ...f, [key]: !f[key as keyof typeof f] }))} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inspection Log */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header" style={{ marginBottom: 10 }}>
                        <h3 className="section-title"><List size={14} style={{ marginRight: 6 }} />Session Log</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sessionLog.length}</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                        {sessionLog.length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', paddingTop: 20 }}>Waiting for detections...</p>
                            : sessionLog.map((entry, i) => {
                                const col = entry.severity === 'critical' ? 'var(--accent-red)' : entry.severity === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-cyan)';
                                return (
                                    <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid rgba(30,46,80,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Clock size={10} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 56 }}>{entry.time}</span>
                                        <span style={{ fontSize: '0.75rem', color: col, fontWeight: 600 }}>{entry.type}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{entry.conf}%</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
