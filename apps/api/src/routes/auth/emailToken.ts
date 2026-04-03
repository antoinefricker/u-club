import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';

const router = Router();

router.post('/email_token', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'token is required' });
    return;
  }

  const loginToken = await db('login_tokens')
    .where({ token })
    .where('expires_at', '>', new Date())
    .first();

  if (!loginToken) {
    res.status(401).json({ error: 'invalid or expired token' });
    return;
  }

  await db('login_tokens').where({ id: loginToken.id }).del();

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'server configuration error' });
    return;
  }

  const accessToken = jwt.sign({ email: loginToken.email }, jwtSecret, {
    expiresIn: '7d',
  });

  res.json({ access_token: accessToken });
});

export default router;
