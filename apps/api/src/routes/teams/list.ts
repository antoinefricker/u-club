import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

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
 *     responses:
 *       200:
 *         description: Array of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    const query = db('teams').select(
      'id',
      'club_id',
      'label',
      'gender',
      'description',
      'created_at',
      'updated_at',
    );

    if (req.query.club_id) {
      query.where({ club_id: req.query.club_id });
    }

    const teams = await query;
    res.json(teams);
  },
);

export default router;
