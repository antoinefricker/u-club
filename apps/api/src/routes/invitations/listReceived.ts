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
 *                   member_id:
 *                     type: string
 *                     format: uuid
 *                   invited_by:
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
 *                   expires_at:
 *                     type: string
 *                     format: date-time
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   member_first_name:
 *                     type: string
 *                   member_last_name:
 *                     type: string
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  const userRecord = await db('users').where({ id: user.id }).first();
  if (!userRecord) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  const invitations = await db('member_invitations')
    .join('members', 'members.id', 'member_invitations.member_id')
    .where('member_invitations.email', userRecord.email)
    .whereNull('member_invitations.accepted_at')
    .where('member_invitations.expires_at', '>', new Date())
    .select(
      'member_invitations.id',
      'member_invitations.member_id',
      'member_invitations.invited_by',
      'member_invitations.email',
      'member_invitations.type',
      'member_invitations.description',
      'member_invitations.expires_at',
      'member_invitations.created_at',
      'members.first_name as member_first_name',
      'members.last_name as member_last_name',
    );

  res.json(invitations);
});

export default router;
