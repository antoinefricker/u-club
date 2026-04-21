import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateMemberStatusSchema } from '../../schemas/memberStatus.js';

const router = Router();

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
  validate(updateMemberStatusSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates = { ...req.body };

    if (updates.label) {
      const existing = await db('memberStatuses')
        .where({ label: updates.label })
        .whereNot({ id })
        .first();
      if (existing) {
        res.status(409).json({ error: 'label already in use' });
        return;
      }
    }

    const [status] = await db('memberStatuses')
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
