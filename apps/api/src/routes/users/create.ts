import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import db from '../../db.js';
import { hashPassword } from '../../password.js';
import mailer from '../../mailer.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema } from '../../schemas/user.js';

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
router.post(
  '/',
  validate(createUserSchema),
  async (req: Request, res: Response) => {
    const { displayName, bio, phone, email, password } = req.body;

    const existing = await db('users').where({ email }).first();
    if (existing) {
      res.status(409).json({ error: 'email already in use' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const userCount = await db('users').count('id as count').first();
    const role = Number(userCount?.count) === 0 ? 'admin' : 'user';

    const [user] = await db('users')
      .insert({
        displayName,
        bio: bio || null,
        phone: phone || null,
        email,
        password: hashedPassword,
        role,
      })
      .returning([
        'id',
        'displayName',
        'bio',
        'phone',
        'email',
        'role',
        'createdAt',
        'updatedAt',
      ]);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db('authTokens').insert({
      email,
      token,
      expiresAt,
      type: 'confirmation',
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'noreply@eggplant.app',
      to: email,
      subject: 'Verify your email',
      text: `Click here to verify your email: ${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}\n\nThis link expires in 24 hours.`,
    });

    res.status(201).json(user);
  },
);

export default router;
