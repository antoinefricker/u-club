import { Router, Request, Response } from 'express';
import db from '../../db.js';
import mailer from '../../mailer.js';
import { validate } from '../../middleware/validate.js';
import { verifyEmailResendSchema } from '../../schemas/auth.js';
import { createEmailToken } from '../../utils/emailToken.js';

const router = Router();

/**
 * @openapi
 * /auth/verify_email_resend:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
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
router.post('/verify_email_resend', validate(verifyEmailResendSchema), async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user || user.emailVerifiedAt) {
        res.json({ message: 'verification email sent' });
        return;
    }

    await db('authTokens').where({ email, type: 'confirmation' }).del();

    const { token, expiresAt } = createEmailToken(24 * 60 * 60 * 1000);

    await db('authTokens').insert({
        email,
        token,
        expiresAt,
        type: 'confirmation',
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await mailer.sendMail({
        from: process.env.SMTP_FROM || 'noreply@eggplant.app',
        to: email,
        subject: 'Verify your email',
        text: `Click here to verify your email: ${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}\n\nThis link expires in 24 hours.`,
    });

    res.json({ message: 'verification email sent' });
});

export default router;
