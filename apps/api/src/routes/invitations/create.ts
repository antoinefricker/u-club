import { Router, Request, Response } from 'express';
import db from '../../db.js';
import mailer from '../../mailer.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createInvitationSchema } from '../../schemas/invitation.js';
import { createEmailToken } from '../../utils/emailToken.js';

const router = Router();

/**
 * @openapi
 * /invitations:
 *   post:
 *     tags: [Invitations]
 *     summary: Create a member invitation
 *     description: Admin/manager can invite for any member. Regular users must be linked to the member.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, email, type]
 *             properties:
 *               memberId:
 *                 type: string
 *                 format: uuid
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [self, relative]
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Invitation created and email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Not linked to this member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireAuth, validate(createInvitationSchema), async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const isPrivileged = user.role === 'admin' || user.role === 'manager';
    const { memberId, email, type, description } = req.body;

    if (!isPrivileged) {
        const link = await db('userMembers').where({ userId: user.id, memberId }).first();
        if (!link) {
            res.status(403).json({ error: 'not linked to this member' });
            return;
        }
    }

    const { token, expiresAt } = createEmailToken(7 * 24 * 60 * 60 * 1000);

    await db('memberInvitations').insert({
        memberId,
        invitedBy: user.id,
        email,
        type,
        description: description ?? null,
        token,
        expiresAt,
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await mailer.sendMail({
        from: process.env.SMTP_FROM || 'noreply@eggplant.app',
        to: email,
        subject: "You've been invited to Eggplant",
        text: `You've been invited to join a member on Eggplant.\n\nClick here to accept: ${appUrl}/invitation?token=${token}&email=${encodeURIComponent(email)}\n\nThis link expires in 7 days.`,
    });

    res.status(201).json({ message: 'invitation sent' });
});

export default router;
