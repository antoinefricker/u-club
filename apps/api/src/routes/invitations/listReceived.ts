import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /invitations:
 *   get:
 *     tags: [Invitations]
 *     summary: List pending invitations for the current user
 *     description: Returns non-expired, non-accepted invitations matching the current user's email.
 *     responses:
 *       200:
 *         description: List of pending invitations
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
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   memberFirstName:
 *                     type: string
 *                   memberLastName:
 *                     type: string
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  const userRecord = await db('users').where({ id: user.id }).first();
  if (!userRecord) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  const invitations = await db('memberInvitations')
    .join('members', 'members.id', 'memberInvitations.memberId')
    .where('memberInvitations.email', userRecord.email)
    .whereNull('memberInvitations.acceptedAt')
    .where('memberInvitations.expiresAt', '>', new Date())
    .select(
      'memberInvitations.id',
      'memberInvitations.memberId',
      'memberInvitations.invitedBy',
      'memberInvitations.email',
      'memberInvitations.type',
      'memberInvitations.description',
      'memberInvitations.expiresAt',
      'memberInvitations.createdAt',
      'members.firstName as memberFirstName',
      'members.lastName as memberLastName',
    );

  res.json(invitations);
});

export default router;
