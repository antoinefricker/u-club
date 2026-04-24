import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /teams/{id}:
 *   delete:
 *     tags: [Teams]
 *     summary: Delete a team
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Team deleted
 *       404:
 *         description: Team not found
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

        const deleted = await db('teams').where({ id }).del();

        if (!deleted) {
            res.status(404).json({ error: 'team not found' });
            return;
        }

        res.status(204).send();
    },
);

export default router;
