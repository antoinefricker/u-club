import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /user-members/{id}:
 *   delete:
 *     tags: [UserMembers]
 *     summary: Delete a user-member association
 *     description: Owner or admin/manager can delete.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: User-member association deleted
 *       403:
 *         description: Not allowed to delete this association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User-member association not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const isPrivileged = user.role === 'admin' || user.role === 'manager';
  const { id } = req.params;

  const userMember = await db('user_members').where({ id }).first();
  if (!userMember) {
    res.status(404).json({ error: 'user-member association not found' });
    return;
  }

  if (!isPrivileged && userMember.user_id !== user.id) {
    res.status(403).json({ error: 'not allowed to delete this association' });
    return;
  }

  await db('user_members').where({ id }).del();

  res.status(204).send();
});

export default router;
