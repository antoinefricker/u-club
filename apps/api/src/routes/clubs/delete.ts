import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /clubs/{id}:
 *   delete:
 *     tags: [Clubs]
 *     summary: Delete a club
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Club deleted
 *       404:
 *         description: Club not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await db('clubs').where({ id }).del();

    if (!deleted) {
      res.status(404).json({ error: 'club not found' });
      return;
    }

    res.status(204).send();
  },
);

export default router;
