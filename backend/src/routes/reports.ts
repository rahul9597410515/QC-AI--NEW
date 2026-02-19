import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// GET /api/reports/summary
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const [total, critical, warning, info, last24h] = await Promise.all([
            prisma.defectEvent.count(),
            prisma.defectEvent.count({ where: { severity: 'critical' } }),
            prisma.defectEvent.count({ where: { severity: 'warning' } }),
            prisma.defectEvent.count({ where: { severity: 'info' } }),
            prisma.defectEvent.count({ where: { timestamp: { gte: new Date(Date.now() - 86400000) } } }),
        ]);
        const passRate = total > 0 ? Math.round(((total - critical - warning) / total) * 1000) / 10 : 100;
        res.json({ total, critical, warning, info, last24h, passRate });
    } catch (err) { next(err); }
});

// POST /api/reports/export  — simple CSV
router.post('/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { from, to, environment, severity } = req.body as Record<string, string | undefined>;
        const where: Record<string, unknown> = {};
        if (from || to) {
            where['timestamp'] = {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
            };
        }
        if (environment) where['environment'] = environment;
        if (severity) where['severity'] = severity;

        const defects = await prisma.defectEvent.findMany({
            where, orderBy: { timestamp: 'desc' }, take: 5000,
        });

        const header = 'id,type,severity,line,camera,confidence,product,environment,timestamp';
        const rows = defects.map(d =>
            `${d.id},${d.type},${d.severity},${d.line},${d.camera},${d.confidence},${d.product},${d.environment},${d.timestamp.toISOString()}`
        );
        const csv = [header, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="qc-ai-report-${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) { next(err); }
});

export default router;
