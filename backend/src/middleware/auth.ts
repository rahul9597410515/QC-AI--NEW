import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
    user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    const token = header.slice(7);
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
