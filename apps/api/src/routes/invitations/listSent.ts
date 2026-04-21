import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /invitations/sent:
 *   get:
 *     tags: [Invitations]
 *     summary: List invitations sent by the current user
 *     description: Returns all invitations where the current user is the inviter.
 *     responses:
 *       200:
 *         description: List of sent invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   memberId:
 *                     type: string
 *                     format: uuid
 *                   invitedBy:
 *                     type: string
 *                     format: uuid
 *                   email:
 *                     type: string
 *                     format: email
 *                   type:
 *                     type: string
 *                     enum: [self, relative]
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   token:
 *                     type: string
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   acceptedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   memberFirstName:
 *                     type: string
 *                   memberLastName:
 *                     type: string
 */
router.get('/sent', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  const invitations = await db('memberInvitations')
    .join('members', 'members.id', 'memberInvitations.memberId')
    .where('memberInvitations.invitedBy', user.id)
    .select(
      'memberInvitations.id',
      'memberInvitations.memberId',
      'memberInvitations.invitedBy',
      'memberInvitations.email',
      'memberInvitations.type',
      'memberInvitations.description',
      'memberInvitations.token',
      'memberInvitations.expiresAt',
      'memberInvitations.acceptedAt',
      'memberInvitations.createdAt',
      'members.firstName as memberFirstName',
      'members.lastName as memberLastName',
    );

  res.json(invitations);
});

export default router;
