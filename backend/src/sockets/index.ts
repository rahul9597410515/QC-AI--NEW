import { Server as HttpServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { env } from '../config/env';
import { generateDefectEvent } from '../services/defectSimulator';
import { generateSensorReadings, generateSensorSnapshot } from '../services/sensorSimulator';
import { prisma } from '../config/prisma';

let currentEnvironment = 'Automotive';

async function persistAndEmitSensorData(io: SocketIO) {
    const readings = generateSensorReadings();
    const snapshot = generateSensorSnapshot();

    io.emit('sensor:update', readings);

    // Persist snapshot
    await prisma.sensorSnapshot.create({
        data: {
            temperature: snapshot.temperature,
            vibration: snapshot.vibration,
            pressure: snapshot.pressure,
            humidity: snapshot.humidity,
            speed: snapshot.speed,
            current: snapshot.current,
        },
    }).catch(console.error);

    // Auto-alert for critical readings
    for (const r of readings) {
        if (r.status === 'critical') {
            const alert = await prisma.alert.create({
                data: {
                    severity: 'critical',
                    message: `${r.name} critical: ${r.value}${r.unit} (limit ${r.critMax}${r.unit})`,
                    source: 'Sensor',
                },
            }).catch(console.error);
            if (alert) io.emit('alert:new', alert);
        }
    }
}

async function persistAndEmitDefect(io: SocketIO) {
    const evt = generateDefectEvent(currentEnvironment);

    const saved = await prisma.defectEvent.create({
        data: {
            type: evt.type, severity: evt.severity, line: evt.line,
            camera: evt.camera, confidence: evt.confidence,
            x: evt.x, y: evt.y, width: evt.width, height: evt.height,
            product: evt.product, environment: evt.environment,
        },
    }).catch((e: unknown) => { console.error('DB write error:', e); return null; });

    if (saved) {
        io.emit('defect:new', { ...evt, id: saved.id });

        if (evt.severity === 'critical') {
            const alert = await prisma.alert.create({
                data: {
                    severity: 'critical',
                    message: `Critical ${evt.type} detected on ${evt.line}`,
                    source: evt.line,
                },
            }).catch(console.error);
            if (alert) io.emit('alert:new', alert);
        }
    }
}

export function initSockets(httpServer: HttpServer) {
    const io = new SocketIO(httpServer, {
        cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
    });

    io.on('connection', socket => {
        console.log('[Socket.IO] Client connected:', socket.id);
        socket.on('set-environment', (newEnv: string) => { currentEnvironment = newEnv; });
        socket.on('disconnect', () => console.log('[Socket.IO] Client disconnected:', socket.id));
    });

    // ── Sensor stream — every 2s ──────────────────
    setInterval(() => { persistAndEmitSensorData(io).catch(console.error); }, 2000);

    // ── Defect stream — every 5s ─────────────────
    setInterval(() => { persistAndEmitDefect(io).catch(console.error); }, 5000);

    return io;
}
