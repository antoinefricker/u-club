import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createMemberStatusSchema } from '../../schemas/memberStatus.js';

const router = Router();

/**
 * @openapi
 * /member-statuses:
 *   post:
 *     tags: [MemberStatuses]
 *     summary: Create a new member status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label]
 *             properties:
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member status created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MemberStatus'
 *       400:
 *         description: Missing required fields
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
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createMemberStatusSchema),
  async (req: Request, res: Response) => {
    const { label } = req.body;

    const existing = await db('member_statuses').where({ label }).first();
    if (existing) {
      res.status(409).json({ error: 'label already in use' });
      return;
    }

    const [status] = await db('member_statuses')
      .insert({ label })
      .returning(['id', 'label']);

    res.status(201).json(status);
  },
);

export default router;
