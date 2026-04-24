import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createTeamCategorySchema } from '../../schemas/teamCategory.js';

const router = Router();

/**
 * @openapi
 * /team-categories:
 *   post:
 *     tags: [TeamCategories]
 *     summary: Create a new team category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamCategoryRequest'
 *     responses:
 *       201:
 *         description: Team category created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamCategory'
 *       400:
 *         description: Missing or invalid fields
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
router.post(
    '/',
    requireAuth,
    requireRole('admin', 'manager'),
    validate(createTeamCategorySchema),
    async (req: Request, res: Response) => {
        const { clubId, label } = req.body;

        const existing = await db('teamCategories')
            .where({ clubId, label })
            .first();
        if (existing) {
            res.status(409).json({
                error: 'label already in use for this club',
            });
            return;
        }

        const [category] = await db('teamCategories')
            .insert({ clubId, label })
            .returning(['id', 'clubId', 'label', 'createdAt', 'updatedAt']);

        res.status(201).json(category);
    },
);

export default router;
