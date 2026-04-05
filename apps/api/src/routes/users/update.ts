import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { hashPassword } from '../../password.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireSelfOrRole } from '../../middleware/requireSelfOrRole.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from '../../schemas/user.js';

const router = Router();

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update an existing user
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
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: No valid fields to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  requireAuth,
  requireSelfOrRole('admin'),
  validate(updateUserSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const updates: Record<string, unknown> = { ...req.body };

    if (updates.email) {
      const existing = await db('users')
        .where({ email: updates.email })
        .whereNot({ id })
        .first();
      if (existing) {
        res.status(409).json({ error: 'email already in use' });
        return;
      }
    }

    if (updates.password && typeof updates.password === 'string') {
      updates.password = await hashPassword(updates.password);
    }

    updates.updated_at = new Date().toISOString();

    const [user] = await db('users')
      .where({ id })
      .update(updates)
      .returning([
        'id',
        'display_name',
        'bio',
        'phone',
        'email',
        'role',
        'created_at',
        'updated_at',
      ]);

    if (!user) {
      res.status(404).json({ error: 'user not found' });
      return;
    }

    res.json(user);
  },
);

export default router;
