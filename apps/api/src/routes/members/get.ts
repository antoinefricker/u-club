import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

/**
 * @openapi
 * /members/{id}:
 *   get:
 *     tags: [Members]
 *     summary: Get a member by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    '/:id',
    requireAuth,
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const member = await db('members')
            .select(
                'id',
                'statusId',
                'firstName',
                'lastName',
                'birthdate',
                'gender',
                'createdAt',
                'updatedAt',
            )
            .where({ id })
            .first();

        if (!member) {
            res.status(404).json({ error: 'member not found' });
            return;
        }

        res.json(member);
    },
);

export default router;
