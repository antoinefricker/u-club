import { Router, Request, Response } from 'express';
import db from '../../db.js';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../../middleware/auth.js';
import { paginationQuerySchema } from '../../schemas/pagination.js';
import {
  applyPagination,
  buildPaginationMeta,
} from '../../utils/pagination.js';

const router = Router();

/**
 * @openapi
 * /invitations/sent:
 *   get:
 *     tags: [Invitations]
 *     summary: List invitations sent by the current user
 *     description: Returns all invitations where the current user is the inviter.
 *     parameters:
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
 *         description: Paginated list of sent invitations
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
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sent', requireAuth, async (req: Request, res: Response) => {
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

  const user = (req as AuthenticatedRequest).user;

  const query = db('memberInvitations')
    .join('members', 'members.id', 'memberInvitations.memberId')
    .where('memberInvitations.invitedBy', user.id)
    .select(
      'memberInvitations.id',
      'memberInvitations.memberId',
      'memberInvitations.invitedBy',
      'memberInvitations.email',
      'memberInvitations.type',
      'memberInvitations.description',
      'memberInvitations.token',
      'memberInvitations.expiresAt',
      'memberInvitations.acceptedAt',
      'memberInvitations.createdAt',
      'members.firstName as memberFirstName',
      'members.lastName as memberLastName',
    )
    .orderBy('memberInvitations.id', 'asc');

  const { data, totalItems } = await applyPagination(query, parsed.data);

  res.json({
    data,
    pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
  });
});

export default router;
