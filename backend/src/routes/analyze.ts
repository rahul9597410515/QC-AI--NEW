import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/aiAnalysis';
import { prisma } from '../config/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// POST /api/analyze
router.post('/', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const imageBase64 = req.file.buffer.toString('base64');
        const environment = (req.body as Record<string, string>)['environment'] ?? 'Automotive';
        const line = (req.body as Record<string, string>)['line'] ?? 'Live Monitor';

        const result = await analyzeImage(imageBase64);

        // Persist each detected defect to the database
        if (result.boxes.length > 0) {
            await prisma.defectEvent.createMany({
                data: result.boxes.map(box => ({
                    type: box.type,
                    severity: box.severity,
                    line,
                    camera: 0,
                    confidence: box.confidence,
                    x: box.x,
                    y: box.y,
                    width: box.w,
                    height: box.h,
                    product: 'Live Capture',
                    environment,
                })),
            });
        }

        res.json(result);
    } catch (err) { next(err); }
});

export default router;
