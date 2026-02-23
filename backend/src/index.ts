import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { initSockets } from './sockets';
import authRouter from './routes/auth';
import defectsRouter from './routes/defects';
import sensorsRouter from './routes/sensors';
import alertsRouter from './routes/alerts';
import analyticsRouter from './routes/analytics';
import reportsRouter from './routes/reports';
import configRouter from './routes/config';
import analyzeRouter from './routes/analyze';

const app = express();
const httpServer = http.createServer(app);

// ── Security middleware ────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(rateLimit({ windowMs: 60_000, max: 300, message: { error: 'Too many requests' } }));

// ── Body parsers ───────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Debug Logging ──────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ── Health check ───────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API routes ─────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/defects', defectsRouter);
app.use('/api/sensors', sensorsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/config', configRouter);
app.use('/api/analyze', analyzeRouter);

// ── Error handler ──────────────────────────────
app.use(errorHandler);

// ── Socket.IO ──────────────────────────────────
initSockets(httpServer);

// ── Start server ───────────────────────────────
httpServer.listen(env.PORT, () => {
    console.log(`\n🚀 QC AI Backend running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Database:    SQLite (./qc-ai.db)`);
    console.log(`   AI Provider: ${env.AI_PROVIDER}`);
    console.log(`   CORS Origin: ${env.CORS_ORIGIN}\n`);
});
