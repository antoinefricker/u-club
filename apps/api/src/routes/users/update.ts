import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { hashPassword } from '../../password.js';

const router = Router();

const ALLOWED_FIELDS = [
  'first_name',
  'last_name',
  'display_name',
  'bio',
  'phone',
  'email',
  'password',
  'birthdate',
] as const;

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'no valid fields to update' });
    return;
  }

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
      'first_name',
      'last_name',
      'display_name',
      'bio',
      'phone',
      'email',
      'birthdate',
      'created_at',
      'updated_at',
    ]);

  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  res.json(user);
});

export default router;
