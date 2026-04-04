import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /clubs:
 *   post:
 *     tags: [Clubs]
 *     summary: Create a new club
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClubRequest'
 *     responses:
 *       201:
 *         description: Club created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Code already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req: Request, res: Response) => {
  const { name, code, description, media_logo_lg, media_logo_sm } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const existing = await db('clubs').where({ code }).first();
  if (existing) {
    res.status(409).json({ error: 'code already in use' });
    return;
  }

  const [club] = await db('clubs')
    .insert({
      name,
      code,
      description: description || null,
      media_logo_lg: media_logo_lg || null,
      media_logo_sm: media_logo_sm || null,
    })
    .returning([
      'id',
      'name',
      'code',
      'description',
      'media_logo_lg',
      'media_logo_sm',
      'created_at',
      'updated_at',
    ]);

  res.status(201).json(club);
});

export default router;
