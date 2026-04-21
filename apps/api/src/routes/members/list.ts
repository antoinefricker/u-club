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
      'members.statusId',
      'members.firstName',
      'members.lastName',
      'members.birthdate',
      'members.gender',
      'members.createdAt',
      'members.updatedAt',
    );

    if (teamId) {
      query
        .join('teamAssignments', 'members.id', 'teamAssignments.memberId')
        .where('teamAssignments.teamId', teamId as string);
    }

    const members = await query;

    res.json(members);
  },
);

export default router;
