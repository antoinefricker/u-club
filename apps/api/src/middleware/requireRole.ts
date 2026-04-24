import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ error: 'insufficient permissions' });
            return;
        }
        next();
    };
}
