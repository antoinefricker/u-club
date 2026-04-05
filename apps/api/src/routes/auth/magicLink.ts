import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import db from '../../db.js';
import mailer from '../../mailer.js';
import { validate } from '../../middleware/validate.js';
import { magicLinkSchema } from '../../schemas/auth.js';

const router = Router();

/**
 * @openapi
 * /auth/magic_link:
 *   post:
 *     tags: [Auth]
 *     summary: Request a magic login link
 *     description: Sends a one-time login token to the given email address. Always returns success to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Login email sent (or silently ignored if user does not exist)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: login email sent
 *       400:
 *         description: Missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/magic_link',
  validate(magicLinkSchema),
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      res.json({ message: 'login email sent' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db('auth_tokens').insert({
      email,
      token,
      expires_at: expiresAt,
    });

    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'noreply@eggplant.app',
      to: email,
      subject: 'Your login code',
      text: `Your login link is: ${token}\n\nThis token expires in 15 minutes.`,
    });

    res.json({ message: 'login email sent' });
  },
);

export default router;
