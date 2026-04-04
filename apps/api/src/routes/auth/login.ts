import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import { verifyPassword } from '../../password.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: Authenticates a user with email and password and returns a JWT access token valid for 7 days.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: JWT access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

  if (!user.email_verified_at) {
    res.status(403).json({ error: 'email not verified' });
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
