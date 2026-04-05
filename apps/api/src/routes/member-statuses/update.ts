import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

const ALLOWED_FIELDS = ['label'] as const;

/**
 * @openapi
 * /member-statuses/{id}:
 *   put:
 *     tags: [MemberStatuses]
 *     summary: Update an existing member status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberStatus'
 *       400:
 *         description: No valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Member status not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Label already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'no valid fields to update' });
      return;
    }

    if (updates.label) {
      const existing = await db('member_statuses')
        .where({ label: updates.label })
        .whereNot({ id })
        .first();
      if (existing) {
        res.status(409).json({ error: 'label already in use' });
        return;
      }
    }

    const [status] = await db('member_statuses')
      .where({ id })
      .update(updates)
      .returning(['id', 'label']);

    if (!status) {
      res.status(404).json({ error: 'member status not found' });
      return;
    }

    res.json(status);
  },
);

export default router;
