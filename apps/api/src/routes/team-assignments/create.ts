import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createTeamAssignmentSchema } from '../../schemas/teamAssignment.js';

const router = Router();

/**
 * @openapi
 * /team-assignments:
 *   post:
 *     tags: [TeamAssignments]
 *     summary: Assign a member to a team
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamAssignmentRequest'
 *     responses:
 *       201:
 *         description: Member assigned to team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamAssignmentRow'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team or member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Member already has this role on this team
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
        const { teamId, memberId, role } = req.body;

        const team = await db('teams').where({ id: teamId }).first('id');
        if (!team) {
            res.status(404).json({ error: 'team not found' });
            return;
        }

        const member = await db('members').where({ id: memberId }).first('id');
        if (!member) {
            res.status(404).json({ error: 'member not found' });
            return;
        }

        const existing = await db('teamAssignments').where({ teamId, memberId, role }).first('id');
        if (existing) {
            res.status(409).json({ error: 'member already has this role on this team' });
            return;
        }

        const [{ id }] = await db('teamAssignments').insert({ teamId, memberId, role }).returning('id');

        const row = await db('teamAssignments')
            .join('teams', 'teamAssignments.teamId', 'teams.id')
            .join('members', 'teamAssignments.memberId', 'members.id')
            .leftJoin('teamCategories', 'teams.categoryId', 'teamCategories.id')
            .where('teamAssignments.id', id)
            .first(
                'teamAssignments.id',
                'teamAssignments.teamId',
                'teamAssignments.memberId',
                'teamAssignments.role',
                'teamAssignments.createdAt',
                'teamAssignments.updatedAt',
                'teams.label as teamLabel',
                'teams.gender as teamGender',
                'teamCategories.label as teamCategoryLabel',
                'members.firstName as memberFirstName',
                'members.lastName as memberLastName',
            );

        res.status(201).json(row);
    },
);

export default router;
