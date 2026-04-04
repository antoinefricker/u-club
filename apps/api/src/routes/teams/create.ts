import { Router, Request, Response } from 'express';
import db from '../../db.js';

const VALID_GENDERS = ['male', 'female', 'both'] as const;

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
router.post('/', async (req: Request, res: Response) => {
  const { club_id, label, year, gender, description } = req.body;

  if (!club_id || typeof club_id !== 'string') {
    res.status(400).json({ error: 'club_id is required' });
    return;
  }

  if (!label || typeof label !== 'string') {
    res.status(400).json({ error: 'label is required' });
    return;
  }

  if (year === undefined || typeof year !== 'number') {
    res.status(400).json({ error: 'year is required' });
    return;
  }

  if (!gender || !VALID_GENDERS.includes(gender)) {
    res.status(400).json({ error: 'gender must be male, female, or both' });
    return;
  }

  const [team] = await db('teams')
    .insert({
      club_id,
      label,
      year,
      gender,
      description: description || null,
    })
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

  res.status(201).json(team);
});

export default router;
