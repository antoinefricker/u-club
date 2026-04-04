import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /clubs/{id}:
 *   get:
 *     tags: [Clubs]
 *     summary: Get a club by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The club
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       404:
 *         description: Club not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const club = await db('clubs')
    .select(
      'id',
      'name',
      'code',
      'description',
      'media_logo_lg',
      'media_logo_sm',
      'created_at',
      'updated_at',
    )
    .where({ id })
    .first();

  if (!club) {
    res.status(404).json({ error: 'club not found' });
    return;
  }

  res.json(club);
});

export default router;
