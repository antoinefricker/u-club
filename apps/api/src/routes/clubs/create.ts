import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createClubSchema } from '../../schemas/club.js';

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
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createClubSchema),
  async (req: Request, res: Response) => {
    const { name, code, description, mediaLogoLg, mediaLogoSm } = req.body;

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
        mediaLogoLg: mediaLogoLg || null,
        mediaLogoSm: mediaLogoSm || null,
      })
      .returning([
        'id',
        'name',
        'code',
        'description',
        'mediaLogoLg',
        'mediaLogoSm',
        'createdAt',
        'updatedAt',
      ]);

    res.status(201).json(club);
  },
);

export default router;
