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

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
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
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, pagination]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid pagination parameters
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

    const query = db('users')
      .select(
        'id',
        'displayName',
        'bio',
        'phone',
        'email',
        'role',
        'createdAt',
        'updatedAt',
      )
      .orderBy('id', 'asc');

    const { data, totalItems } = await applyPagination(query, parsed.data);

    res.json({
      data,
      pagination: buildPaginationMeta({ ...parsed.data, totalItems }),
    });
  },
);

export default router;
