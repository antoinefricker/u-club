import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /members/{memberId}/teams:
 *   get:
 *     tags: [Members]
 *     summary: List a member's team assignments
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Array of team assignments with team metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MemberTeamAssignment'
 */
router.get('/:memberId/teams', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    const { memberId } = req.params;

    const assignments = await db('teamAssignments')
        .join('teams', 'teamAssignments.teamId', 'teams.id')
        .leftJoin('teamCategories', 'teams.categoryId', 'teamCategories.id')
        .where('teamAssignments.memberId', memberId)
        .orderBy('teams.label', 'asc')
        .select(
            'teamAssignments.id',
            'teams.id as teamId',
            'teams.label as teamLabel',
            'teams.gender as teamGender',
            'teamCategories.label as teamCategoryLabel',
            'teamAssignments.role',
            'teamAssignments.createdAt',
        );

    res.json(assignments);
});

export default router;
