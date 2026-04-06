import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /invitations/{id}:
 *   delete:
 *     tags: [Invitations]
 *     summary: Cancel an invitation
 *     description: Only the sender or an admin can cancel an invitation.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Invitation deleted
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;

  const invitation = await db('member_invitations').where({ id }).first();
  if (!invitation) {
    res.status(404).json({ error: 'invitation not found' });
    return;
  }

  if (invitation.invited_by !== user.id && user.role !== 'admin') {
    res.status(404).json({ error: 'invitation not found' });
    return;
  }

  await db('member_invitations').where({ id }).del();

  res.status(204).send();
});

export default router;
