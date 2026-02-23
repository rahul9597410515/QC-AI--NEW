import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, User, Lock, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useAuth();
    const [mode, setMode] = useState<'admin' | 'user'>('admin'); // Tabs: 'admin' or 'user'
    const [isRegistering, setIsRegistering] = useState(false); // Only for 'user' mode

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [particles] = useState(() =>
        Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, delay: Math.random() * 4, dur: 3 + Math.random() * 4 }))
    );

    // Pre-fill admin credentials when switching to admin tab
    useEffect(() => {
        if (mode === 'admin') {
            setEmail('admin@qcai.dev');
            setPassword('admin123');
            setIsRegistering(false);
            setError('');
        } else {
            setEmail('');
            setPassword('');
            setError('');
        }
    }, [mode]);

    useEffect(() => {
        if (isAuthenticated) navigate('/');
    }, [isAuthenticated, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        setError('');
        try {
            if (mode === 'user' && isRegistering) {
                await register(email, password);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-ui)',
        }}>
            {/* Animated Background */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {particles.map(p => (
                    <circle key={p.id} cx={`${p.x}%`} cy={`${p.y}%`} r={1.5} fill="rgba(0,212,255,0.4)">
                        <animate attributeName="opacity" values="0;0.8;0" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values={`${p.y}%;${p.y - 15}%;${p.y}%`} dur={`${p.dur * 1.5}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </svg>
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 20 }}>

                {/* Logo Area */}
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-cyan), #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        boxShadow: '0 0 20px rgba(99,102,241,0.5)'
                    }}>
                        <Shield size={32} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>QC AI Access</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select your role to continue</p>
                </div>

                {/* Login Card */}
                <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 20, border: '1px solid var(--border)',
                    overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setMode('admin')}
                            style={{
                                flex: 1, padding: '16px', background: mode === 'admin' ? 'rgba(99,102,241,0.1)' : 'transparent',
                                border: 'none', color: mode === 'admin' ? '#6366f1' : 'var(--text-muted)',
                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                borderBottom: mode === 'admin' ? '2px solid #6366f1' : '2px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Briefcase size={16} /> Admin Login
                            </div>
                        </button>
                        <button
                            onClick={() => setMode('user')}
                            style={{
                                flex: 1, padding: '16px', background: mode === 'user' ? 'rgba(6,182,212,0.1)' : 'transparent',
                                border: 'none', color: mode === 'user' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                borderBottom: mode === 'user' ? '2px solid var(--accent-cyan)' : '2px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <User size={16} /> User Login
                            </div>
                        </button>
                    </div>

                    <div style={{ padding: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            {mode === 'admin' ? 'System Administrator' : (isRegistering ? 'Create New Account' : 'Operator Access')}
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                            {mode === 'admin' ? 'Enter admin credentials to manage system.' : (isRegistering ? 'Fill in details to register.' : 'Log in to access your dashboard.')}
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        className="input"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={mode === 'admin' ? "admin@qcai.dev" : "user@company.com"}
                                        style={{ width: '100%', paddingLeft: 38 }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        className="input"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', paddingLeft: 38, paddingRight: 40 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 8, color: '#ef4444', fontSize: '0.8rem', textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: 12, justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700,
                                    background: mode === 'admin' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, var(--accent-cyan), #0ea5e9)',
                                    boxShadow: mode === 'admin' ? '0 4px 12px rgba(99,102,241,0.3)' : '0 4px 12px rgba(6,182,212,0.3)',
                                    border: 'none'
                                }}
                            >
                                {loading ? 'Processing…' : (mode === 'admin' ? 'Login as Admin' : (isRegistering ? 'Create Account' : 'Login as User'))}
                            </button>
                        </form>

                        {/* User Registration Toggle */}
                        {mode === 'user' && (
                            <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {isRegistering ? 'Already have an account? ' : 'New to QC AI? '}
                                    <button
                                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--accent-cyan)',
                                            fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
                                        }}
                                    >
                                        {isRegistering ? 'Login here' : 'Register now'}
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Admin Hint */}
                        {mode === 'admin' && (
                            <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Authorized personnel only. System activity is logged.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float { 0% { transform: translateY(0px) } 50% { transform: translateY(-10px) } 100% { transform: translateY(0px) } }
            `}</style>
        </div>
    );
}
