import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// GET /api/defects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const qs = (k: string): string | undefined => {
            const v = req.query[k];
            if (typeof v === 'string') return v;
            if (Array.isArray(v) && typeof v[0] === 'string') return v[0] as string;
            return undefined;
        };
        const line = qs('line');
        const severity = qs('severity');
        const environment = qs('environment');
        const page = parseInt(qs('page') ?? '1');
        const limit = parseInt(qs('limit') ?? '50');
        const skip = (page - 1) * limit;
        const where: Record<string, unknown> = {};
        if (line) where['line'] = line;
        if (severity) where['severity'] = severity;
        if (environment) where['environment'] = environment;

        const [items, total] = await Promise.all([
            prisma.defectEvent.findMany({ where, skip, take: limit, orderBy: { timestamp: 'desc' } }),
            prisma.defectEvent.count({ where }),
        ]);
        res.json({ items, total, page, limit });
    } catch (err) { next(err); }
});

// GET /api/defects/summary
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [bySeverity, byType, total] = await Promise.all([
            prisma.defectEvent.groupBy({ by: ['severity'], _count: { id: true } }),
            prisma.defectEvent.groupBy({ by: ['type'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
            prisma.defectEvent.count(),
        ]);
        res.json({ total, bySeverity, byType });
    } catch (err) { next(err); }
});

// GET /api/defects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const defect = await prisma.defectEvent.findUnique({ where: { id: String(req.params['id']) } });
        if (!defect) { res.status(404).json({ error: 'Defect not found' }); return; }
        res.json(defect);
    } catch (err) { next(err); }
});

export default router;
