import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /invitations/by-token/{token}:
 *   get:
 *     tags: [Invitations]
 *     summary: Look up an invitation by its token (public)
 *     description: |
 *       Public endpoint used by the invitation landing page to fetch invitation details and discover whether
 *       an account already exists for the invited email. The token itself is the authorization.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation details and whether the invited email already has an account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [invitation, userExists]
 *               properties:
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     email: { type: string, format: email }
 *                     memberId: { type: string, format: uuid }
 *                     memberFirstName: { type: string }
 *                     memberLastName: { type: string }
 *                     type: { type: string, enum: [self, relative] }
 *                     description: { type: string, nullable: true }
 *                     expiresAt: { type: string, format: date-time }
 *                 userExists:
 *                   type: boolean
 *       400:
 *         description: Invitation has expired or has already been accepted
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
 */
router.get('/by-token/:token', async (req: Request, res: Response) => {
    const { token } = req.params;

    const invitation = await db('memberInvitations')
        .select(
            'memberInvitations.id',
            'memberInvitations.email',
            'memberInvitations.memberId',
            'memberInvitations.type',
            'memberInvitations.description',
            'memberInvitations.expiresAt',
            'memberInvitations.acceptedAt',
            'members.firstName as memberFirstName',
            'members.lastName as memberLastName',
        )
        .join('members', 'memberInvitations.memberId', 'members.id')
        .where({ 'memberInvitations.token': token })
        .first();

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

    const existingUser = await db('users').where({ email: invitation.email }).first();

    const { acceptedAt, ...invitationBody } = invitation;
    void acceptedAt;

    res.json({
        invitation: invitationBody,
        userExists: existingUser !== undefined,
    });
});

export default router;
