import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import db from '../../db.js';
import mailer from '../../mailer.js';
import { validate } from '../../middleware/validate.js';
import { resendConfirmationSchema } from '../../schemas/auth.js';

const router = Router();

/**
 * @openapi
 * /auth/resend_confirmation:
 *   post:
 *     tags: [Auth]
 *     summary: Resend confirmation email
 *     description: Sends a new confirmation email. Always returns success to prevent email enumeration.
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
 *         description: Confirmation email sent (or silently ignored)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/resend_confirmation',
  validate(resendConfirmationSchema),
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user || user.email_verified_at) {
      res.json({ message: 'confirmation email sent' });
      return;
    }

    await db('login_tokens').where({ email, type: 'confirmation' }).del();

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db('login_tokens').insert({
      email,
      token,
      expires_at: expiresAt,
      type: 'confirmation',
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'noreply@u-club.app',
      to: email,
      subject: 'Confirm your email',
      text: `Click here to confirm your email: ${appUrl}/confirm-email?token=${token}&email=${encodeURIComponent(email)}\n\nThis link expires in 24 hours.`,
    });

    res.json({ message: 'confirmation email sent' });
  },
);

export default router;
