import { Router, Request, Response } from 'express';
import db from '../../db.js';

const ALLOWED_FIELDS = [
  'label',
  'year',
  'gender',
  'description',
  'archived',
] as const;

const VALID_GENDERS = ['male', 'female', 'both'] as const;

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
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'no valid fields to update' });
    return;
  }

  if (
    updates.gender &&
    !VALID_GENDERS.includes(updates.gender as (typeof VALID_GENDERS)[number])
  ) {
    res.status(400).json({ error: 'gender must be male, female, or both' });
    return;
  }

  updates.updated_at = new Date().toISOString();

  const [team] = await db('teams')
    .where({ id })
    .update(updates)
    .returning([
      'id',
      'club_id',
      'label',
      'year',
      'gender',
      'description',
      'archived',
      'created_at',
      'updated_at',
    ]);

  if (!team) {
    res.status(404).json({ error: 'team not found' });
    return;
  }

  res.json(team);
});

export default router;
