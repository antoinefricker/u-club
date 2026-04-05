import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

const ALLOWED_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'license',
  'gender',
  'year',
  'user_id',
  'status_id',
] as const;

/**
 * @openapi
 * /members/{id}:
 *   put:
 *     tags: [Members]
 *     summary: Update an existing member
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
 *             $ref: '#/components/schemas/UpdateMemberRequest'
 *     responses:
 *       200:
 *         description: Member updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       400:
 *         description: No valid fields to update or invalid gender
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
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

    if (
      updates.gender !== undefined &&
      updates.gender !== 'male' &&
      updates.gender !== 'female'
    ) {
      res.status(400).json({ error: "gender must be 'male' or 'female'" });
      return;
    }

    updates.updated_at = new Date().toISOString();

    const [member] = await db('members')
      .where({ id })
      .update(updates)
      .returning([
        'id',
        'user_id',
        'status_id',
        'first_name',
        'last_name',
        'birth_date',
        'license',
        'gender',
        'year',
        'created_at',
        'updated_at',
      ]);

    if (!member) {
      res.status(404).json({ error: 'member not found' });
      return;
    }

    res.json(member);
  },
);

export default router;
