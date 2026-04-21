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
 * /user-members:
 *   get:
 *     tags: [UserMembers]
 *     summary: List user-member associations
 *     description: Admin/manager can list all (optionally filtered by userId). Regular users only see their own.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID (admin/manager only; ignored for regular users)
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
 *         description: Paginated list of user-member associations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserMember'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
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
  const isPrivileged = user.role === 'admin' || user.role === 'manager';

  const query = db('userMembers')
    .select(
      'userMembers.id',
      'userMembers.userId',
      'userMembers.memberId',
      'userMembers.type',
      'userMembers.description',
      'userMembers.createdAt',
      'members.firstName as memberFirstName',
      'members.lastName as memberLastName',
    )
    .join('members', 'userMembers.memberId', 'members.id')
    .orderBy('userMembers.id', 'asc');

  if (isPrivileged) {
    const { userId } = req.query;
    if (userId) {
      query.where('userMembers.userId', userId);
    }
  } else {
    query.where('userMembers.userId', user.id);
  }

  const { data, totalItems } = await applyPagination(query, parsed.data);

  res.json({
    data,
    pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
  });
});

export default router;
