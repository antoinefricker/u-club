import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createUserMemberSchema } from '../../schemas/userMember.js';

const router = Router();

/**
 * @openapi
 * /user-members:
 *   post:
 *     tags: [UserMembers]
 *     summary: Create a user-member association
 *     description: Admin/manager can create for any user. Regular users can only create for themselves.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserMemberRequest'
 *     responses:
 *       201:
 *         description: User-member association created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserMember'
 *       403:
 *         description: Not allowed to create for another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Association already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireAuth,
  validate(createUserMemberSchema),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const isPrivileged = user.role === 'admin' || user.role === 'manager';
    const { userId, memberId, type, description } = req.body;

    if (!isPrivileged && userId !== user.id) {
      res.status(403).json({ error: 'not allowed to create for another user' });
      return;
    }

    const existing = await db('userMembers')
      .where({ userId, memberId })
      .first();
    if (existing) {
      res.status(409).json({ error: 'association already exists' });
      return;
    }

    const [userMember] = await db('userMembers')
      .insert({
        userId,
        memberId,
        type,
        description: description ?? null,
      })
      .returning([
        'id',
        'userId',
        'memberId',
        'type',
        'description',
        'createdAt',
      ]);

    res.status(201).json(userMember);
  },
);

export default router;
