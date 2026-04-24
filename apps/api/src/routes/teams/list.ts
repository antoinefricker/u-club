import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { paginationQuerySchema } from '../../schemas/pagination.js';
import { applyPagination, buildPaginationMeta } from '../../utils/pagination.js';
import { TEAM_GENDERS, type TeamGender } from '../../types/team.js';

const router = Router();

/**
 * @openapi
 * /teams:
 *   get:
 *     tags: [Teams]
 *     summary: List all teams
 *     parameters:
 *       - in: query
 *         name: clubId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter teams by club ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter teams by category ID
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, mixed]
 *         description: Filter teams by gender
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
 *         description: Paginated list of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid filter or pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', requireAuth, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    if (req.query.gender) {
        const gender = req.query.gender;
        if (typeof gender !== 'string' || !TEAM_GENDERS.includes(gender as TeamGender)) {
            res.status(400).json({
                error: 'gender must be male, female, or mixed',
            });
            return;
        }
    }

    if (req.query.categoryId) {
        const categoryId = req.query.categoryId;
        if (typeof categoryId !== 'string' || !z.uuid().safeParse(categoryId).success) {
            res.status(400).json({
                error: 'categoryId must be a valid uuid',
            });
            return;
        }
    }

    const parsed = paginationQuerySchema.safeParse(req.query);
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

    const query = db('teams')
        .leftJoin('teamCategories', 'teams.categoryId', 'teamCategories.id')
        .select(
            'teams.id',
            'teams.clubId',
            'teams.categoryId',
            'teams.label',
            'teams.gender',
            'teams.description',
            'teams.createdAt',
            'teams.updatedAt',
            'teamCategories.label as categoryLabel',
        )
        .orderBy('teams.id', 'asc');

    if (req.query.clubId) {
        query.where('teams.clubId', req.query.clubId);
    }

    if (req.query.categoryId) {
        query.where('teams.categoryId', req.query.categoryId);
    }

    if (req.query.gender) {
        query.where('teams.gender', req.query.gender as string);
    }

    const { data, totalItems } = await applyPagination(query, parsed.data);

    res.json({
        data,
        pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
    });
});

export default router;
