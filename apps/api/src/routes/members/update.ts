import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateMemberSchema } from '../../schemas/member.js';

const router = Router();

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
  validate(updateMemberSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates = { ...req.body };
    updates.updated_at = new Date().toISOString();

    const [member] = await db('members')
      .where({ id })
      .update(updates)
      .returning([
        'id',
        'status_id',
        'first_name',
        'last_name',
        'birthdate',
        'gender',
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
