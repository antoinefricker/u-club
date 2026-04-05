import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /member-statuses:
 *   get:
 *     tags: [MemberStatuses]
 *     summary: List all member statuses
 *     responses:
 *       200:
 *         description: Array of member statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MemberStatus'
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const statuses = await db('member_statuses').select('id', 'label');

    res.json(statuses);
  },
);

export default router;
