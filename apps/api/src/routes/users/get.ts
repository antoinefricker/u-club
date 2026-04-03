import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

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
