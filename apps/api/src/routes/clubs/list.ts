import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /clubs:
 *   get:
 *     tags: [Clubs]
 *     summary: List all clubs
 *     responses:
 *       200:
 *         description: Array of clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Club'
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const clubs = await db('clubs').select(
      'id',
      'name',
      'code',
      'description',
      'media_logo_lg',
      'media_logo_sm',
      'created_at',
      'updated_at',
    );

    res.json(clubs);
  },
);

export default router;
