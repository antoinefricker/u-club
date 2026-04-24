import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import db from '../../db.js';
import mailer from '../../mailer.js';
import { validate } from '../../middleware/validate.js';
import { forgotPasswordSchema } from '../../schemas/auth.js';

const router = Router();

/**
 * @openapi
 * /auth/forgot_password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     description: Sends a password reset email. Always returns success to prevent email enumeration.
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
 *         description: Password reset email sent (or silently ignored)
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
    '/forgot_password',
    validate(forgotPasswordSchema),
    async (req: Request, res: Response) => {
        const { email } = req.body;

        const user = await db('users').where({ email }).first();
        if (!user) {
            res.json({ message: 'password reset email sent' });
            return;
        }

        await db('authTokens').where({ email, type: 'password_reset' }).del();

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db('authTokens').insert({
            email,
            token,
            expiresAt,
            type: 'password_reset',
        });

        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        await mailer.sendMail({
            from: process.env.SMTP_FROM || 'noreply@eggplant.app',
            to: email,
            subject: 'Reset your password',
            text: `Click here to reset your password: ${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}\n\nThis link expires in 1 hour.`,
        });

        res.json({ message: 'password reset email sent' });
    },
);

export default router;
