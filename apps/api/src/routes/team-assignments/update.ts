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
 *     summary: Update a team assignment's role
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
 *         description: Assignment not found
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
        const { role } = req.body;

        const existing = await db('teamAssignments').where({ id }).first('id');
        if (!existing) {
            res.status(404).json({ error: 'assignment not found' });
            return;
        }

        await db('teamAssignments').where({ id }).update({ role, updatedAt: new Date().toISOString() });

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
