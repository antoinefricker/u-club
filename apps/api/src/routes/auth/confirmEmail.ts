import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import { validate } from '../../middleware/validate.js';
import { confirmEmailSchema } from '../../schemas/auth.js';

const router = Router();

/**
 * @openapi
 * /auth/confirm_email:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm email address
 *     description: Validates the confirmation token, marks the email as verified, and returns a JWT access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, email]
 *             properties:
 *               token:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email confirmed and JWT returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *       400:
 *         description: Missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired token, or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/confirm_email',
  validate(confirmEmailSchema),
  async (req: Request, res: Response) => {
    const { token, email } = req.body;

    const loginToken = await db('login_tokens')
      .where({ token, email, type: 'confirmation' })
      .where('expires_at', '>', new Date())
      .first();

    if (!loginToken) {
      res.status(401).json({ error: 'invalid or expired token' });
      return;
    }

    await db('login_tokens').where({ id: loginToken.id }).del();

    const user = await db('users').where({ email: loginToken.email }).first();
    if (!user) {
      res.status(401).json({ error: 'user not found' });
      return;
    }

    await db('users')
      .where({ id: user.id })
      .update({ email_verified_at: new Date() });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'server configuration error' });
      return;
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      jwtSecret,
      {
        expiresIn: '7d',
      },
    );

    res.json({ access_token: accessToken });
  },
);

export default router;
