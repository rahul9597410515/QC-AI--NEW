import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    fontFamily: 'monospace',
                    padding: 32,
                    background: '#0A0F1E',
                    color: '#EF4444',
                    minHeight: '100vh',
                    fontSize: 14,
                }}>
                    <h2 style={{ color: '#00D4FF', marginBottom: 16 }}>🚨 QC AI — Runtime Error</h2>
                    <pre style={{ color: '#F59E0B', marginBottom: 12 }}>{this.state.error.message}</pre>
                    <pre style={{ color: '#94A3B8', fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
