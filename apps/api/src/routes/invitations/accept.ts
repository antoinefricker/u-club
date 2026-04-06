import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { acceptInvitationSchema } from '../../schemas/invitation.js';

const router = Router();

/**
 * @openapi
 * /invitations/{id}/accept:
 *   post:
 *     tags: [Invitations]
 *     summary: Accept an invitation
 *     description: Accepts a pending invitation and creates a user-member association.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [self, relative]
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Invitation accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Already accepted or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email does not match invitation
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
router.post(
  '/:id/accept',
  requireAuth,
  validate(acceptInvitationSchema),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const { type, description } = req.body;

    const invitation = await db('member_invitations').where({ id }).first();
    if (!invitation) {
      res.status(404).json({ error: 'invitation not found' });
      return;
    }

    if (invitation.accepted_at) {
      res.status(400).json({ error: 'invitation already accepted' });
      return;
    }

    if (new Date(invitation.expires_at) < new Date()) {
      res.status(400).json({ error: 'invitation has expired' });
      return;
    }

    const userRecord = await db('users').where({ id: user.id }).first();
    if (!userRecord || userRecord.email !== invitation.email) {
      res.status(403).json({ error: 'email does not match invitation' });
      return;
    }

    await db.transaction(async (trx) => {
      await trx('user_members').insert({
        user_id: user.id,
        member_id: invitation.member_id,
        type: type ?? invitation.type,
        description: description ?? invitation.description ?? null,
      });

      await trx('member_invitations').where({ id }).update({
        accepted_at: new Date(),
      });
    });

    res.json({ message: 'invitation accepted' });
  },
);

export default router;
