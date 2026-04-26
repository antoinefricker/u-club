import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateTeamAssignmentSchema } from '../../schemas/teamAssignment.js';

const router = Router();

/**
 * @openapi
 * /team-assignments/{id}:
 *   put:
 *     tags: [TeamAssignments]
 *     summary: Update a team assignment's team and/or role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamAssignmentRequest'
 *     responses:
 *       200:
 *         description: Assignment updated
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
 *         description: Assignment or new team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Member is already assigned to the new team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    '/:id',
    requireAuth,
    requireRole('admin', 'manager'),
    validate(updateTeamAssignmentSchema),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { teamId, role } = req.body;

        const existing = await db('teamAssignments').where({ id }).first('id', 'teamId', 'memberId');
        if (!existing) {
            res.status(404).json({ error: 'assignment not found' });
            return;
        }

        if (teamId && teamId !== existing.teamId) {
            const team = await db('teams').where({ id: teamId }).first('id');
            if (!team) {
                res.status(404).json({ error: 'team not found' });
                return;
            }

            const conflict = await db('teamAssignments')
                .where({ teamId, memberId: existing.memberId })
                .whereNot({ id })
                .first('id');
            if (conflict) {
                res.status(409).json({ error: 'member is already assigned to this team' });
                return;
            }
        }

        const updates: { teamId?: string; role?: string; updatedAt: string } = {
            updatedAt: new Date().toISOString(),
        };
        if (teamId !== undefined) updates.teamId = teamId;
        if (role !== undefined) updates.role = role;

        await db('teamAssignments').where({ id }).update(updates);

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

        res.status(200).json(row);
    },
);

export default router;
