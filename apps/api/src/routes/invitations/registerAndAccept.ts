import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../db.js';
import { hashPassword } from '../../password.js';
import { validate } from '../../middleware/validate.js';
import { registerAndAcceptInvitationSchema } from '../../schemas/invitation.js';

const router = Router();

/**
 * @openapi
 * /invitations/by-token/{token}/register-and-accept:
 *   post:
 *     tags: [Invitations]
 *     summary: Register a new user and accept an invitation in one step (public)
 *     description: |
 *       Creates a pre-verified user account from an invitation token and accepts the invitation atomically.
 *       The invited email is taken from the invitation itself, not the request body. The click on the
 *       emailed invitation link is treated as proof of email ownership, so the user's email is marked as
 *       verified immediately. Returns a JWT access token so the UI can log the user in directly.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [displayName, password]
 *             properties:
 *               displayName: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201:
 *         description: User created, invitation accepted, JWT returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       400:
 *         description: Invitation expired or already accepted, or body validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: An account already exists for the invited email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/by-token/:token/register-and-accept',
    validate(registerAndAcceptInvitationSchema),
    async (req: Request, res: Response) => {
        const { token } = req.params;
        const { displayName, password } = req.body;

        const invitation = await db('memberInvitations').where({ token }).first();

        if (!invitation) {
            res.status(404).json({ error: 'invitation not found' });
            return;
        }

        if (invitation.acceptedAt) {
            res.status(400).json({ error: 'invitation already accepted' });
            return;
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            res.status(400).json({ error: 'invitation has expired' });
            return;
        }

        const existing = await db('users').where({ email: invitation.email }).first();
        if (existing) {
            res.status(409).json({ error: 'an account already exists for this email; log in instead' });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ error: 'server configuration error' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        const user = await db.transaction(async (trx) => {
            const [created] = await trx('users')
                .insert({
                    displayName,
                    email: invitation.email,
                    password: hashedPassword,
                    role: 'user',
                    emailVerifiedAt: new Date(),
                })
                .returning(['id', 'email', 'role']);

            await trx('userMembers').insert({
                userId: created.id,
                memberId: invitation.memberId,
                type: invitation.type,
                description: invitation.description ?? null,
            });

            await trx('memberInvitations').where({ id: invitation.id }).update({
                acceptedAt: new Date(),
            });

            return created;
        });

        const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, jwtSecret, {
            expiresIn: '7d',
        });

        res.status(201).json({ accessToken });
    },
);

export default router;
