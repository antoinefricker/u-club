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
    })
    .refine((data) => (data.userId === undefined) !== (data.memberId === undefined), {
        message: 'exactly one of userId or memberId is required',
    });

/**
 * @openapi
 * /invitations:
 *   get:
 *     tags: [Invitations]
 *     summary: List pending invitations
 *     description: >
 *       Returns non-expired, non-accepted invitations matching the filter.
 *       Exactly one of `userId` or `memberId` must be provided.
 *       `userId` returns invitations received by that user (matched by their email).
 *       Regular users may only pass their own `userId`. `memberId` is admin/manager only.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by recipient user (matched by the user's email). Mutually exclusive with `memberId`.
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by target member ID — admin/manager only. Mutually exclusive with `userId`.
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
 *         description: Paginated list of pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MemberInvitation'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid or missing query parameters
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
 *         description: User not found (when filtering by userId)
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
    const { userId, memberId } = parsed.data;

    const query = db('memberInvitations')
        .join('members', 'members.id', 'memberInvitations.memberId')
        .join('users as inviters', 'inviters.id', 'memberInvitations.invitedBy')
        .whereNull('memberInvitations.acceptedAt')
        .where('memberInvitations.expiresAt', '>', new Date())
        .select(
            'memberInvitations.id',
            'memberInvitations.memberId',
            'memberInvitations.invitedBy',
            'memberInvitations.email',
            'memberInvitations.type',
            'memberInvitations.description',
            'memberInvitations.expiresAt',
            'memberInvitations.createdAt',
            'members.firstName as memberFirstName',
            'members.lastName as memberLastName',
            'inviters.displayName as invitedByDisplayName',
            'inviters.email as invitedByEmail',
        )
        .orderBy('memberInvitations.id', 'asc');

    if (memberId) {
        if (!isPrivileged) {
            res.status(403).json({ error: 'insufficient permissions' });
            return;
        }
        query.where('memberInvitations.memberId', memberId);
    } else {
        if (!isPrivileged && userId !== user.id) {
            res.status(403).json({ error: 'insufficient permissions' });
            return;
        }

        const userRecord = await db('users').where({ id: userId }).first('email');
        if (!userRecord) {
            res.status(404).json({ error: 'user not found' });
            return;
        }
        query.where('memberInvitations.email', userRecord.email);
    }

    const { data, totalItems } = await applyPagination(query, parsed.data);

    res.json({
        data,
        pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
    });
});

export default router;
