import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// GET /api/alerts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const raw = req.query['severity'];
        const severity = typeof raw === 'string' ? raw : undefined;
        const where: Record<string, unknown> = { dismissed: false };
        if (severity) where['severity'] = severity;
        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { timestamp: 'desc' },
        });
        res.json(alerts);
    } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alert = await prisma.alert.update({
            where: { id: String(req.params['id']) },
            data: { acknowledged: true },
        });
        res.json(alert);
    } catch (err) { next(err); }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.alert.update({
            where: { id: String(req.params['id']) },
            data: { dismissed: true },
        });
        res.status(204).send();
    } catch (err) { next(err); }
});

export default router;
