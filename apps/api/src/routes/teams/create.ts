import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createTeamSchema } from '../../schemas/team.js';

const router = Router();

/**
 * @openapi
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       201:
 *         description: Team created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  validate(createTeamSchema),
  async (req: Request, res: Response) => {
    const { clubId, label, gender, description, categoryId } = req.body;

    const [team] = await db('teams')
      .insert({
        clubId,
        label,
        gender,
        description: description || null,
        categoryId: categoryId || null,
      })
      .returning([
        'id',
        'clubId',
        'categoryId',
        'label',
        'gender',
        'description',
        'createdAt',
        'updatedAt',
      ]);

    res.status(201).json(team);
  },
);

export default router;
