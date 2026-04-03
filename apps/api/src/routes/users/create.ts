import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { hashPassword } from '../../password.js';

const router = Router();

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
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
router.post('/', async (req: Request, res: Response) => {
  const { display_name, bio, phone, email, password } = req.body;

  if (!display_name || typeof display_name !== 'string') {
    res.status(400).json({ error: 'display_name is required' });
    return;
  }

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'password is required' });
    return;
  }

  const existing = await db('users').where({ email }).first();
  if (existing) {
    res.status(409).json({ error: 'email already in use' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await db('users')
    .insert({
      display_name,
      bio: bio || null,
      phone: phone || null,
      email,
      password: hashedPassword,
    })
    .returning([
      'id',
      'display_name',
      'bio',
      'phone',
      'email',
      'created_at',
      'updated_at',
    ]);

  res.status(201).json(user);
});

export default router;
