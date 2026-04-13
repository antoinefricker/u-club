import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /members:
 *   get:
 *     tags: [Members]
 *     summary: List all members
 *     parameters:
 *       - in: query
 *         name: teamId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter members by team
 *     responses:
 *       200:
 *         description: Array of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const { teamId } = req.query;

    const query = db('members').select(
      'members.id',
      'members.status_id',
      'members.first_name',
      'members.last_name',
      'members.birthdate',
      'members.gender',
      'members.created_at',
      'members.updated_at',
    );

    if (teamId) {
      query
        .join('team_assignments', 'members.id', 'team_assignments.member_id')
        .where('team_assignments.team_id', teamId as string);
    }

    const members = await query;

    res.json(members);
  },
);

export default router;
