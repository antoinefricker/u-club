import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateTeamCategorySchema } from '../../schemas/teamCategory.js';

const router = Router();

/**
 * @openapi
 * /team-categories/{id}:
 *   put:
 *     tags: [TeamCategories]
 *     summary: Update an existing team category
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
 *             $ref: '#/components/schemas/UpdateTeamCategoryRequest'
 *     responses:
 *       200:
 *         description: Team category updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamCategory'
 *       400:
 *         description: No valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Label already in use for this club
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    '/:id',
    requireAuth,
    requireRole('admin', 'manager'),
    validate(updateTeamCategorySchema),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = { ...req.body };

        if (updates.label) {
            const current = await db('teamCategories').select('clubId').where({ id }).first();
            if (!current) {
                res.status(404).json({ error: 'team category not found' });
                return;
            }

            const existing = await db('teamCategories')
                .where({ clubId: current.clubId, label: updates.label })
                .whereNot({ id })
                .first();
            if (existing) {
                res.status(409).json({
                    error: 'label already in use for this club',
                });
                return;
            }
        }

        updates.updatedAt = new Date().toISOString();

        const [category] = await db('teamCategories')
            .where({ id })
            .update(updates)
            .returning(['id', 'clubId', 'label', 'createdAt', 'updatedAt']);

        if (!category) {
            res.status(404).json({ error: 'team category not found' });
            return;
        }

        res.json(category);
    },
);

export default router;
