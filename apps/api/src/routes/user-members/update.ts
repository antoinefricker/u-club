import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserMemberSchema } from '../../schemas/userMember.js';

const router = Router();

/**
 * @openapi
 * /user-members/{id}:
 *   put:
 *     tags: [UserMembers]
 *     summary: Update a user-member association
 *     description: Owner or admin/manager can update.
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
 *             $ref: '#/components/schemas/UpdateUserMemberRequest'
 *     responses:
 *       200:
 *         description: User-member association updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserMember'
 *       403:
 *         description: Not allowed to update this association
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User-member association not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', requireAuth, validate(updateUserMemberSchema), async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const isPrivileged = user.role === 'admin' || user.role === 'manager';
    const { id } = req.params;

    const userMember = await db('userMembers').where({ id }).first();
    if (!userMember) {
        res.status(404).json({
            error: 'user-member association not found',
        });
        return;
    }

    if (!isPrivileged && userMember.userId !== user.id) {
        res.status(403).json({
            error: 'not allowed to update this association',
        });
        return;
    }

    const updates: Record<string, unknown> = { ...req.body };

    const [updated] = await db('userMembers')
        .where({ id })
        .update(updates)
        .returning(['id', 'userId', 'memberId', 'type', 'description', 'createdAt']);

    res.json(updated);
});

export default router;
