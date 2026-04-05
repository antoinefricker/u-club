import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createTeamAssignmentSchema } from '../../schemas/teamAssignment.js';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /teams/{teamId}/members:
 *   get:
 *     tags: [Teams]
 *     summary: List members of a team
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Array of team members with role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamAssignment'
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const { teamId } = req.params;

    const members = await db('team_assignments')
      .join('members', 'team_assignments.member_id', 'members.id')
      .where('team_assignments.team_id', teamId)
      .select(
        'members.*',
        'team_assignments.role',
        'team_assignments.created_at as assigned_at',
      );

    res.json(members);
  },
);

/**
 * @openapi
 * /teams/{teamId}/members:
 *   post:
 *     tags: [Teams]
 *     summary: Add a member to a team
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [member_id, role]
 *             properties:
 *               member_id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [player, coach, assistant, sparring]
 *     responses:
 *       201:
 *         description: Member added to team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamAssignment'
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Member already assigned to this team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  validate(createTeamAssignmentSchema),
  async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { member_id, role } = req.body;

    const existing = await db('team_assignments')
      .where({ team_id: teamId, member_id })
      .first();

    if (existing) {
      res
        .status(409)
        .json({ error: 'Member is already assigned to this team' });
      return;
    }

    const [assignment] = await db('team_assignments')
      .insert({
        team_id: teamId,
        member_id,
        role,
      })
      .returning(['id', 'team_id', 'member_id', 'role', 'created_at']);

    res.status(201).json(assignment);
  },
);

/**
 * @openapi
 * /teams/{teamId}/members/{memberId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Remove a member from a team
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Member ID
 *     responses:
 *       204:
 *         description: Member removed from team
 *       404:
 *         description: Assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:memberId',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const { teamId, memberId } = req.params;

    const deleted = await db('team_assignments')
      .where({ team_id: teamId, member_id: memberId })
      .del();

    if (!deleted) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.status(204).send();
  },
);

export default router;
