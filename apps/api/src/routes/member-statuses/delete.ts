import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /member-statuses/{id}:
 *   delete:
 *     tags: [MemberStatuses]
 *     summary: Delete a member status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Member status deleted
 *       404:
 *         description: Member status not found
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

        const deleted = await db('memberStatuses').where({ id }).del();

        if (!deleted) {
            res.status(404).json({ error: 'member status not found' });
            return;
        }

        res.status(204).send();
    },
);

export default router;
