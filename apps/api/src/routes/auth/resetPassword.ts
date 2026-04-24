import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import { validate } from '../../middleware/validate.js';
import { resetPasswordSchema } from '../../schemas/auth.js';
import { hashPassword } from '../../password.js';

const router = Router();

/**
 * @openapi
 * /auth/reset_password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     description: Validates the password reset token, updates the user's password, and returns a JWT access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, email, password]
 *             properties:
 *               token:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset and JWT returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Missing required fields
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
    '/reset_password',
    validate(resetPasswordSchema),
    async (req: Request, res: Response) => {
        const { token, email, password } = req.body;

        const resetToken = await db('authTokens')
            .where({ token, email, type: 'password_reset' })
            .where('expiresAt', '>', new Date())
            .first();

        if (!resetToken) {
            res.status(401).json({ error: 'invalid or expired token' });
            return;
        }

        await db('authTokens').where({ id: resetToken.id }).del();

        const user = await db('users')
            .where({ email: resetToken.email })
            .first();
        if (!user) {
            res.status(401).json({ error: 'user not found' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        await db('users')
            .where({ id: user.id })
            .update({ password: hashedPassword, updatedAt: new Date() });

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

        res.json({ accessToken });
    },
);

export default router;
