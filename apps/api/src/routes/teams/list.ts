import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
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
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, mixed]
 *         description: Filter teams by gender
 *     responses:
 *       200:
 *         description: Array of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid filter value
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
      );

    if (req.query.clubId) {
      query.where('teams.clubId', req.query.clubId);
    }

    if (req.query.gender) {
      const gender = req.query.gender;
      if (
        typeof gender !== 'string' ||
        !TEAM_GENDERS.includes(gender as TeamGender)
      ) {
        res
          .status(400)
          .json({ error: 'gender must be male, female, or mixed' });
        return;
      }
      query.where('teams.gender', gender);
    }

    const teams = await query;
    res.json(teams);
  },
);

export default router;
