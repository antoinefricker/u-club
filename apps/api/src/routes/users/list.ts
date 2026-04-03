import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const users = await db('users').select(
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
  );

  res.json(users);
});

export default router;
