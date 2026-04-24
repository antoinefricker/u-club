import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { paginationQuerySchema } from '../../schemas/pagination.js';
import {
    applyPagination,
    buildPaginationMeta,
} from '../../utils/pagination.js';

const router = Router();

const SEARCH_MAX_LENGTH = 100;
const SEARCH_MAX_TOKENS = 10;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (ch) => `\\${ch}`);

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
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: >
 *           Free-text search. Whitespace-split into up to 10 tokens; each token
 *           must match (case- and accent-insensitive, partial) at least one of
 *           first name, last name, or the DD/MM/YYYY birthdate. `%`, `_`, and
 *           `\` are treated as literals.
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
 *         description: Paginated list of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Member'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid pagination or search parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    '/',
    requireAuth,
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
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

        const { teamId, search } = req.query;

        let searchTokens: string[] = [];
        if (search !== undefined) {
            if (typeof search !== 'string') {
                res.status(400).json({ error: 'search must be a string' });
                return;
            }
            const trimmed = search.trim();
            if (trimmed.length > SEARCH_MAX_LENGTH) {
                res.status(400).json({
                    error: `search must be ${SEARCH_MAX_LENGTH} characters or fewer`,
                });
                return;
            }
            if (trimmed.length > 0) {
                searchTokens = trimmed.split(/\s+/);
                if (searchTokens.length > SEARCH_MAX_TOKENS) {
                    res.status(400).json({
                        error: `search must contain at most ${SEARCH_MAX_TOKENS} tokens`,
                    });
                    return;
                }
            }
        }

        const query = db('members')
            .leftJoin('memberStatuses', 'members.statusId', 'memberStatuses.id')
            .select(
                'members.id',
                'members.statusId',
                'members.firstName',
                'members.lastName',
                'members.birthdate',
                'members.gender',
                'members.createdAt',
                'members.updatedAt',
                'memberStatuses.label as statusLabel',
            )
            .orderBy('members.id', 'asc');

        if (teamId) {
            query
                .join(
                    'teamAssignments',
                    'members.id',
                    'teamAssignments.memberId',
                )
                .where('teamAssignments.teamId', teamId as string);
        }

        for (const token of searchTokens) {
            const pattern = `%${escapeLike(token)}%`;
            query.andWhere((sub) => {
                sub.whereRaw('unaccent(members.first_name) ilike unaccent(?)', [
                    pattern,
                ])
                    .orWhereRaw(
                        'unaccent(members.last_name) ilike unaccent(?)',
                        [pattern],
                    )
                    .orWhereRaw(
                        "unaccent(to_char(members.birthdate, 'DD/MM/YYYY')) ilike unaccent(?)",
                        [pattern],
                    );
            });
        }

        const { data, totalItems } = await applyPagination(query, parsed.data);

        res.json({
            data,
            pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
        });
    },
);

export default router;
