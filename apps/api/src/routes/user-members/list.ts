import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /user-members:
 *   get:
 *     tags: [UserMembers]
 *     summary: List user-member associations
 *     description: Admin/manager can list all (optionally filtered by userId). Regular users only see their own.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID (admin/manager only)
 *     responses:
 *       200:
 *         description: Array of user-member associations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserMember'
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const isPrivileged = user.role === 'admin' || user.role === 'manager';

  const query = db('user_members')
    .select(
      'user_members.id',
      'user_members.user_id',
      'user_members.member_id',
      'user_members.type',
      'user_members.description',
      'user_members.created_at',
      'members.first_name as member_first_name',
      'members.last_name as member_last_name',
    )
    .join('members', 'user_members.member_id', 'members.id');

  if (isPrivileged) {
    const { userId } = req.query;
    if (userId) {
      query.where('user_members.user_id', userId);
    }
  } else {
    query.where('user_members.user_id', user.id);
  }

  const userMembers = await query;

  res.json(userMembers);
});

export default router;
