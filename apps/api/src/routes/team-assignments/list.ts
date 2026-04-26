import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../../db.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { paginationQuerySchema } from '../../schemas/pagination.js';
import { applyPagination, buildPaginationMeta } from '../../utils/pagination.js';

const router = Router();

const listQuerySchema = paginationQuerySchema
    .extend({
        userId: z.uuid({ error: 'userId must be a UUID' }).optional(),
        memberId: z.uuid({ error: 'memberId must be a UUID' }).optional(),
        teamId: z.uuid({ error: 'teamId must be a UUID' }).optional(),
    })
    .refine((data) => [data.userId, data.memberId, data.teamId].filter(Boolean).length <= 1, {
        message: 'userId, memberId and teamId are mutually exclusive',
        path: ['teamId'],
    });

/**
 * @openapi
 * /team-assignments:
 *   get:
 *     tags: [TeamAssignments]
 *     summary: List team assignments
 *     description: >
 *       Admin/manager can list all assignments (optionally filtered by `userId` OR `memberId`).
 *       Regular users only see assignments for members linked to them via `userMembers`;
 *       any `userId` / `memberId` filters are ignored for regular users.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID — admin/manager only; ignored for regular users. Mutually exclusive with `memberId` and `teamId`.
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by member ID — admin/manager only; ignored for regular users. Mutually exclusive with `userId` and `teamId`.
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID — admin/manager only; ignored for regular users. Mutually exclusive with `userId` and `memberId`.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: itemsPerPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *     responses:
 *       200:
 *         description: Paginated list of team assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamAssignmentRow'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid query parameters (including `userId` and `memberId` used together)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({
            error: 'validation error',
            details: parsed.error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    const user = (req as AuthenticatedRequest).user;
    const isPrivileged = user.role === 'admin' || user.role === 'manager';

    const query = db('teamAssignments')
        .join('teams', 'teamAssignments.teamId', 'teams.id')
        .join('members', 'teamAssignments.memberId', 'members.id')
        .leftJoin('teamCategories', 'teams.categoryId', 'teamCategories.id')
        .select(
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
        )
        .orderBy([
            { column: 'teamAssignments.createdAt', order: 'desc' },
            { column: 'teamAssignments.id', order: 'asc' },
        ]);

    if (isPrivileged) {
        const { userId, memberId, teamId } = parsed.data;
        if (teamId) {
            query.where('teamAssignments.teamId', teamId);
        } else if (memberId) {
            query.where('teamAssignments.memberId', memberId);
        } else if (userId) {
            query.whereIn('teamAssignments.memberId', db('userMembers').select('memberId').where('userId', userId));
        }
    } else {
        query.whereIn('teamAssignments.memberId', db('userMembers').select('memberId').where('userId', user.id));
    }

    const { data, totalItems } = await applyPagination(query, parsed.data);

    res.json({
        data,
        pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
    });
});

export default router;
