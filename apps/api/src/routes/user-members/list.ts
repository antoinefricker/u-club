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

  const query = db('userMembers')
    .select(
      'userMembers.id',
      'userMembers.userId',
      'userMembers.memberId',
      'userMembers.type',
      'userMembers.description',
      'userMembers.createdAt',
      'members.firstName as memberFirstName',
      'members.lastName as memberLastName',
    )
    .join('members', 'userMembers.memberId', 'members.id');

  if (isPrivileged) {
    const { userId } = req.query;
    if (userId) {
      query.where('userMembers.userId', userId);
    }
  } else {
    query.where('userMembers.userId', user.id);
  }

  const userMembers = await query;

  res.json(userMembers);
});

export default router;
