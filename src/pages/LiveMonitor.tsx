import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Play, Pause, Upload, List, Clock, X, Aperture, ZoomIn } from 'lucide-react';
import type { BoundingBox, Severity } from '../data/defectStream';
import { generateBoundingBoxes } from '../data/defectStream';

import './LiveMonitor.css';

type InputMode = 'camera' | 'upload';

interface AnalysisResult {
    imageUrl: string;
    boxes: BoundingBox[];
    timestamp: Date;
    source: 'camera' | 'upload';
    filename?: string;
}

// ── Bounding Box Overlay ───────────────────────────
function BBoxOverlay({ box }: { box: BoundingBox }) {
    const color = box.severity === 'critical' ? '#EF4444' : box.severity === 'warning' ? '#F59E0B' : '#00D4FF';
    return (
        <div style={{
            position: 'absolute',
            left: `${box.x}%`, top: `${box.y}%`,
            width: `${box.w}%`, height: `${box.h}%`,
            border: `2px solid ${color}`,
            borderRadius: 4,
            boxShadow: `0 0 10px ${color}55`,
            animation: 'bbox-appear 0.3s ease',
            pointerEvents: 'none',
        }}>
            <div style={{
                position: 'absolute', top: -22, left: 0,
                background: color, color: box.severity === 'warning' ? '#000' : '#fff',
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                padding: '2px 6px', borderRadius: '3px 3px 3px 0', whiteSpace: 'nowrap',
            }}>
                {box.type} {box.confidence}%
            </div>
            {[['0%', '0%'], ['100%', '0%'], ['0%', '100%'], ['100%', '100%']].map(([x, y], i) => (
                <div key={i} style={{ position: 'absolute', left: x, top: y, width: 6, height: 6, background: color, margin: '-3px' }} />
            ))}
        </div>
    );
}

// ── Analysis Result Card ───────────────────────────
function AnalysisCard({ result, onDismiss }: { result: AnalysisResult; onDismiss: () => void }) {
    const critCount = result.boxes.filter(b => b.severity === 'critical').length;
    const warnCount = result.boxes.filter(b => b.severity === 'warning').length;
    const infoCount = result.boxes.filter(b => b.severity === 'info').length;
    const overallStatus = critCount > 0 ? 'FAIL' : warnCount > 1 ? 'WARN' : 'PASS';
    const statusColor = overallStatus === 'FAIL' ? 'var(--accent-red)' : overallStatus === 'WARN' ? 'var(--accent-yellow)' : 'var(--accent-green)';

    return (
        <div className="card" style={{ position: 'relative' }}>
            <button
                onClick={onDismiss}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
                <X size={14} />
            </button>

            {/* Image with overlays */}
            <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <img
                    src={result.imageUrl}
                    alt="Analyzed"
                    style={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'contain', background: '#000' }}
                />
                {result.boxes.map(box => <BBoxOverlay key={box.id} box={box} />)}
                {/* Overlay badge */}
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(10,15,30,0.85)', border: `1px solid ${statusColor}`, borderRadius: 6, padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
                    {overallStatus}
                </div>
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(10,15,30,0.85)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {result.source === 'camera' ? '📷 Captured' : '📁 ' + (result.filename || 'Uploaded')} · {result.timestamp.toLocaleTimeString()}
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                    { label: 'Total Defects', value: result.boxes.length, color: 'var(--text-primary)' },
                    { label: 'Critical', value: critCount, color: 'var(--accent-red)' },
                    { label: 'Warning', value: warnCount, color: 'var(--accent-yellow)' },
                    { label: 'Info', value: infoCount, color: 'var(--accent-cyan)' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 6px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Defect list */}
            {result.boxes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Detected Defects</p>
                    {result.boxes.map(box => {
                        const col = box.severity === 'critical' ? 'var(--accent-red)' : box.severity === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-cyan)';
                        return (
                            <div key={box.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'var(--bg-tertiary)', borderRadius: 6 }}>
                                <span className={`badge badge-${box.severity === 'critical' ? 'red' : box.severity === 'warning' ? 'yellow' : 'cyan'}`}>{box.severity}</span>
                                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{box.type}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: col }}>{box.confidence}%</span>
                            </div>
                        );
                    })}
                </div>
            )}
            {result.boxes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--accent-green)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>✓ No Defects Detected</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Quality check passed</p>
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────
export default function LiveMonitor() {
    const [mode, setMode] = useState<InputMode>('camera');
    const [cameraActive, setCameraActive] = useState(false);
    const [paused, setPaused] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [sessionLog, setSessionLog] = useState<{ time: string; type: string; severity: Severity; conf: number }[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);



    // ── Attach stream when camera becomes active ───────────────────
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(console.error);
        }
    }, [cameraActive]);

    // ── Camera control ──────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
            });
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err: any) {
            setCameraError(err.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera permissions in your browser.'
                : 'Could not access camera. Make sure a camera is connected.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraActive(false);
    }, []);

    useEffect(() => {
        return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
    }, []);

    // ── Capture frame from camera ───────────────────
    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        const imageUrl = canvas.toDataURL('image/jpeg', 0.92);
        runAnalysis(imageUrl, 'camera');
    }, []);

    // ── Analyze image (mock AI) ──────────────────────
    const runAnalysis = useCallback((imageUrl: string, source: 'camera' | 'upload', filename?: string) => {
        setAnalyzing(true);
        setAnalysisResult(null);

        // Simulate AI processing delay (1.2–2s)
        const delay = 1200 + Math.random() * 800;
        setTimeout(() => {
            const numDefects = Math.floor(Math.random() * 5); // 0–4 defects
            const boxes = numDefects > 0 ? generateBoundingBoxes(numDefects) : [];
            const result: AnalysisResult = { imageUrl, boxes, timestamp: new Date(), source, filename };
            setAnalysisResult(result);
            setAnalyzing(false);

            // Add to session log
            boxes.forEach(b => {
                setSessionLog(prev => [{
                    time: new Date().toLocaleTimeString(), type: b.type, severity: b.severity, conf: b.confidence
                }, ...prev.slice(0, 99)]);
            });
        }, delay);
    }, []);

    // ── Handle file upload ───────────────────────────
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (imageUrl) runAnalysis(imageUrl, 'upload', file.name);
        };
        reader.readAsDataURL(file);
    }, [runAnalysis]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    return (
        <div className="animate-page" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, height: '100%' }}>
            {/* ── Left Column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Mode Selector */}
                <div className="card" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="tabs">
                            <button className={`tab${mode === 'camera' ? ' active' : ''}`} onClick={() => { setMode('camera'); setAnalysisResult(null); }}>
                                <Camera size={12} style={{ marginRight: 5 }} />System Camera
                            </button>
                            <button className={`tab${mode === 'upload' ? ' active' : ''}`} onClick={() => { setMode('upload'); stopCamera(); setAnalysisResult(null); }}>
                                <Upload size={12} style={{ marginRight: 5 }} />Upload Image
                            </button>
                        </div>
                        {mode === 'camera' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                {!cameraActive
                                    ? <button className="btn btn-primary btn-sm" onClick={startCamera}><Play size={12} />Start Camera</button>
                                    : <>
                                        <button className="btn btn-sm btn-ghost" onClick={() => setPaused(p => !p)}>
                                            {paused ? <><Play size={12} />Resume</> : <><Pause size={12} />Freeze</>}
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={captureFrame} disabled={paused}>
                                            <Aperture size={12} />Capture & Analyze
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={stopCamera}><X size={12} />Stop</button>
                                    </>
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Camera Feed ── */}
                {mode === 'camera' && (
                    <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
                        {!cameraActive && !cameraError && (
                            <div className="lm-placeholder">
                                <Camera size={52} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                                <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>System Camera</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>Click "Start Camera" to begin live inspection</p>
                                <button className="btn btn-primary" onClick={startCamera}><Play size={14} />Start Camera</button>
                            </div>
                        )}
                        {cameraError && (
                            <div className="lm-placeholder">
                                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚫</div>
                                <p style={{ color: 'var(--accent-red)', fontWeight: 600, marginBottom: 8 }}>Camera Error</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 360, textAlign: 'center', marginBottom: 20 }}>{cameraError}</p>
                                <button className="btn btn-secondary" onClick={startCamera}><Play size={14} />Retry</button>
                            </div>
                        )}
                        {cameraActive && (
                            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 360 }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: paused ? 'brightness(0.5)' : 'none' }}
                                />
                                {/* Status overlay */}
                                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
                                    <div style={{ background: 'rgba(10,15,30,0.85)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                                        <span style={{ color: paused ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>●</span>
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{paused ? 'FROZEN' : 'LIVE'}</span>
                                    </div>
                                </div>
                                {paused && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button className="btn btn-primary" onClick={captureFrame} style={{ fontSize: '0.9rem', padding: '12px 24px' }}>
                                            <Aperture size={18} />Capture & Analyze
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                )}

                {/* ── Upload Zone ── */}
                {mode === 'upload' && (
                    <div
                        className={`card lm-dropzone${dragOver ? ' lm-dropzone--active' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ flex: 1, minHeight: 300, cursor: 'pointer' }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                        />
                        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--accent-cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Upload size={30} color="var(--accent-cyan)" />
                            </div>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 6 }}>
                                {dragOver ? 'Drop image to analyze' : 'Drop an image or click to browse'}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
                                Supports JPEG, PNG, WebP, BMP · AI analysis runs instantly
                            </p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {['PCB', 'Metal Parts', 'Fabric', 'Pharmaceutical'].map(tag => (
                                    <span key={tag} className="badge badge-gray">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Analysis Result ── */}
                {analyzing && (
                    <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                        <div className="lm-spinner" />
                        <p style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginTop: 16, fontSize: '0.9rem' }}>Analyzing image...</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Running AI defect detection model</p>
                    </div>
                )}
                {analysisResult && !analyzing && (
                    <AnalysisCard result={analysisResult} onDismiss={() => setAnalysisResult(null)} />
                )}
            </div>

            {/* ── Right Panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* How to use */}
                <div className="card">
                    <h3 className="section-title" style={{ marginBottom: 14 }}>
                        <ZoomIn size={14} style={{ marginRight: 6 }} />How to Use
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { icon: '📷', title: 'System Camera', desc: 'Start your webcam, freeze frame, then click Capture & Analyze' },
                            { icon: '📁', title: 'Upload Image', desc: 'Drag & drop or click to upload any product photo' },
                            { icon: '🔍', title: 'AI Analysis', desc: 'Defects are detected and marked with bounding boxes + confidence scores' },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 2 }}>{title}</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick analyze another */}
                {mode === 'upload' && (
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', justifyContent: 'center' }}>
                        <Upload size={14} />Upload Another Image
                    </button>
                )}

                {/* Session Log */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header" style={{ marginBottom: 10 }}>
                        <h3 className="section-title"><List size={14} style={{ marginRight: 6 }} />Session Log</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sessionLog.length}</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                        {sessionLog.length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', paddingTop: 20 }}>No detections yet</p>
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
