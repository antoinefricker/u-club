import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /team-categories/{id}:
 *   get:
 *     tags: [TeamCategories]
 *     summary: Get a team category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The team category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamCategory'
 *       404:
 *         description: Team category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await db('teamCategories')
      .select('id', 'clubId', 'label', 'createdAt', 'updatedAt')
      .where({ id })
      .first();

    if (!category) {
      res.status(404).json({ error: 'team category not found' });
      return;
    }

    res.json(category);
  },
);

export default router;
