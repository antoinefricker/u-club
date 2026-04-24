import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /auth/magic_link_verify:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a magic link token for a JWT
 *     description: Validates the one-time token from the login email, resolves the user, and returns a JWT access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
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
router.post('/magic_link_verify', async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'token is required' });
        return;
    }

    const loginToken = await db('authTokens').where({ token }).where('expiresAt', '>', new Date()).first();

    if (!loginToken) {
        res.status(401).json({ error: 'invalid or expired token' });
        return;
    }

    await db('authTokens').where({ id: loginToken.id }).del();

    const user = await db('users').where({ email: loginToken.email }).first();
    if (!user) {
        res.status(401).json({ error: 'user not found' });
        return;
    }

    if (!user.emailVerifiedAt) {
        await db('users').where({ id: user.id }).update({ emailVerifiedAt: new Date() });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'server configuration error' });
        return;
    }

    const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, jwtSecret, {
        expiresIn: '7d',
    });

    res.json({ accessToken });
});

export default router;
