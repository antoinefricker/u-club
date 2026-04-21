import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateClubSchema } from '../../schemas/club.js';

const router = Router();

/**
 * @openapi
 * /clubs/{id}:
 *   put:
 *     tags: [Clubs]
 *     summary: Update an existing club
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
 *             $ref: '#/components/schemas/UpdateClubRequest'
 *     responses:
 *       200:
 *         description: Club updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       400:
 *         description: No valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Club not found
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
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'manager'),
  validate(updateClubSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates: Record<string, unknown> = { ...req.body };

    if (updates.code) {
      const existing = await db('clubs')
        .where({ code: updates.code })
        .whereNot({ id })
        .first();
      if (existing) {
        res.status(409).json({ error: 'code already in use' });
        return;
      }
    }

    updates.updatedAt = new Date().toISOString();

    const [club] = await db('clubs')
      .where({ id })
      .update(updates)
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

    if (!club) {
      res.status(404).json({ error: 'club not found' });
      return;
    }

    res.json(club);
  },
);

export default router;
