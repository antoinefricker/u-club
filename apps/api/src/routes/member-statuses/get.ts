import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /member-statuses/{id}:
 *   get:
 *     tags: [MemberStatuses]
 *     summary: Get a member status by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The member status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberStatus'
 *       404:
 *         description: Member status not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    const { id } = req.params;

    const status = await db('memberStatuses').select('id', 'label').where({ id }).first();

    if (!status) {
        res.status(404).json({ error: 'member status not found' });
        return;
    }

    res.json(status);
});

export default router;
