import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await db('users')
    .select(
      'id',
      'first_name',
      'last_name',
      'display_name',
      'bio',
      'phone',
      'email',
      'birthdate',
      'created_at',
      'updated_at',
    )
    .where({ id })
    .first();

  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  res.json(user);
});

export default router;
