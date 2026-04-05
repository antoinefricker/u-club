import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireSelfOrRole } from '../../middleware/requireSelfOrRole.js';

const router = Router();

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  requireAuth,
  requireSelfOrRole('admin'),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await db('users').where({ id }).del();

    if (!deleted) {
      res.status(404).json({ error: 'user not found' });
      return;
    }

    res.status(204).send();
  },
);

export default router;
