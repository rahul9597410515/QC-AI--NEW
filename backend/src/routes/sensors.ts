import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateSensorReadings } from '../services/sensorSimulator';

const router = Router();

// GET /api/sensors/latest
router.get('/latest', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const readings = generateSensorReadings();
        res.json(readings);
    } catch (err) { next(err); }
});

// GET /api/sensors/history?minutes=30
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const minutes = parseInt((req.query['minutes'] as string | undefined) ?? '30');
        const since = new Date(Date.now() - minutes * 60 * 1000);
        const snapshots = await prisma.sensorSnapshot.findMany({
            where: { timestamp: { gte: since } },
            orderBy: { timestamp: 'asc' },
        });
        res.json(snapshots);
    } catch (err) { next(err); }
});

export default router;
