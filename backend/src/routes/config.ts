import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

const DEFAULT_THRESHOLDS = {
    temperature: { warnMax: 90, critMax: 100 },
    vibration: { warnMax: 6, critMax: 8 },
    pressure: { warnMax: 7, critMax: 9 },
    humidity: { warnMax: 70, critMax: 85 },
    speed: { warnMax: 160, critMax: 180 },
    current: { warnMax: 40, critMax: 45 },
};

const ENVIRONMENTS = ['Automotive', 'Electronics', 'Textile', 'Pharma'];

// GET /api/config
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const configs = await Promise.all(ENVIRONMENTS.map(async env => {
            const existing = await prisma.systemConfig.findUnique({ where: { environment: env } });
            if (existing) return { environment: env, thresholds: JSON.parse(existing.thresholds) };
            return { environment: env, thresholds: DEFAULT_THRESHOLDS };
        }));
        res.json(configs);
    } catch (err) { next(err); }
});

// PUT /api/config
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { environment, thresholds } = req.body as { environment: string; thresholds: object };
        if (!environment || !thresholds) {
            res.status(400).json({ error: 'environment and thresholds are required' });
            return;
        }
        const config = await prisma.systemConfig.upsert({
            where: { environment },
            update: { thresholds: JSON.stringify(thresholds) },
            create: { environment, thresholds: JSON.stringify(thresholds) },
        });
        res.json({ environment: config.environment, thresholds: JSON.parse(config.thresholds) });
    } catch (err) { next(err); }
});

export default router;
