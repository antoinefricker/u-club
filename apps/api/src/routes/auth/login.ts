import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import { verifyPassword } from '../../password.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'password is required' });
    return;
  }

  const user = await db('users').where({ email }).first();

  if (!user) {
    res.status(401).json({ error: 'invalid email or password' });
    return;
  }

  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    res.status(401).json({ error: 'invalid email or password' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'server configuration error' });
    return;
  }

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, {
    expiresIn: '7d',
  });

  res.json({ access_token: accessToken });
});

export default router;
