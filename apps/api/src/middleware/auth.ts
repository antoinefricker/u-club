import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'authentication required' });
        return;
    }

    const token = header.slice(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'server configuration error' });
        return;
    }

    try {
        const payload = jwt.verify(token, jwtSecret) as {
            sub: string;
            email: string;
            role: string;
        };
        (req as AuthenticatedRequest).user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        next();
    } catch {
        res.status(401).json({ error: 'invalid or expired token' });
    }
}
