// ============================================
// QC AI — Socket.IO Client
// Connects to backend real-time streams.
// ============================================
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

let _socket: Socket | null = null;

export function getSocket(): Socket {
    if (!_socket) {
        _socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        _socket.on('connect', () => console.log('[Socket.IO] Connected:', _socket?.id));
        _socket.on('disconnect', () => console.log('[Socket.IO] Disconnected'));
        _socket.on('connect_error', (err) => console.warn('[Socket.IO] Error:', err.message));
    }
    return _socket;
}

export function disconnectSocket() {
    _socket?.disconnect();
    _socket = null;
}
