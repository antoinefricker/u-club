import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const result = await db.raw('SELECT NOW()');
  res.json({ status: 'ok', time: result.rows[0].now });
});

export default router;
