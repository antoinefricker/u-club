import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get a team by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const team = await db('teams')
    .select(
      'id',
      'club_id',
      'label',
      'year',
      'gender',
      'description',
      'archived',
      'created_at',
      'updated_at',
    )
    .where({ id })
    .first();

  if (!team) {
    res.status(404).json({ error: 'team not found' });
    return;
  }

  res.json(team);
});

export default router;
