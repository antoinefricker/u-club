import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';

const router = Router();

router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'server configuration error' });
    return;
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ error: 'invalid token' });
    return;
  }

  await db('revoked_tokens').insert({
    token,
    expires_at: new Date((payload.exp ?? 0) * 1000),
  });

  res.json({ message: 'logged out' });
});

export default router;
