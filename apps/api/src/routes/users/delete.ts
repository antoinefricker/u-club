import { Router, Request, Response } from 'express';
import db from '../../db.js';

const router = Router();

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await db('users').where({ id }).del();

  if (!deleted) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  res.status(204).send();
});

export default router;
