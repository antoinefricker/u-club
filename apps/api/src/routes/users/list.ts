import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', async (req: Request, res: Response) => {
  const users = await db('users').select(
    'id',
    'display_name',
    'bio',
    'phone',
    'email',
    'created_at',
    'updated_at',
  );

  res.json(users);
});

export default router;
