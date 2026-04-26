import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /team-assignments/{id}:
 *   delete:
 *     tags: [TeamAssignments]
 *     summary: Remove a team assignment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     responses:
 *       204:
 *         description: Assignment removed
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await db('teamAssignments').where({ id }).del();
    if (!deleted) {
        res.status(404).json({ error: 'assignment not found' });
        return;
    }

    res.status(204).send();
});

export default router;
