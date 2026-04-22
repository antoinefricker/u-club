import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateTeamSchema } from '../../schemas/team.js';

const router = Router();

/**
 * @openapi
 * /teams/{id}:
 *   put:
 *     tags: [Teams]
 *     summary: Update an existing team
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamRequest'
 *     responses:
 *       200:
 *         description: Team updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: No valid fields to update or invalid gender
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  validate(updateTeamSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates = { ...req.body };
    updates.updatedAt = new Date().toISOString();

    const [team] = await db('teams')
      .where({ id })
      .update(updates)
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

    if (!team) {
      res.status(404).json({ error: 'team not found' });
      return;
    }

    res.json(team);
  },
);

export default router;
