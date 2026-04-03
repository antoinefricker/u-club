import { Router, Request, Response } from 'express';
import db from '../../db.js';
import { hashPassword } from '../../password.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const {
    first_name,
    last_name,
    display_name,
    bio,
    phone,
    email,
    password,
    birthdate,
  } = req.body;

  if (!first_name || typeof first_name !== 'string') {
    res.status(400).json({ error: 'first_name is required' });
    return;
  }

  if (!last_name || typeof last_name !== 'string') {
    res.status(400).json({ error: 'last_name is required' });
    return;
  }

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
      first_name,
      last_name,
      display_name,
      bio: bio || null,
      phone: phone || null,
      email,
      password: hashedPassword,
      birthdate: birthdate || null,
    })
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

  res.status(201).json(user);
});

export default router;
