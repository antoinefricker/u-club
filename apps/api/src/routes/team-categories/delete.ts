import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /team-categories/{id}:
 *   delete:
 *     tags: [TeamCategories]
 *     summary: Delete a team category
 *     description: Teams referencing the deleted category keep their rows; their category_id is set to NULL.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Team category deleted
 *       404:
 *         description: Team category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
    '/:id',
    requireAuth,
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const deleted = await db('teamCategories').where({ id }).del();

        if (!deleted) {
            res.status(404).json({ error: 'team category not found' });
            return;
        }

        res.status(204).send();
    },
);

export default router;
