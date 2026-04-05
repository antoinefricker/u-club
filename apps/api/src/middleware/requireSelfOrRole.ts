import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

export function requireSelfOrRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.id !== req.params.id && !roles.includes(user.role))) {
      res.status(403).json({ error: 'insufficient permissions' });
      return;
    }
    next();
  };
}
