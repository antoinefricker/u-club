import express, { Request, Response } from 'express';
import db from './db.js';

const app = express();

app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  const result = await db.query('SELECT NOW()');
  res.json({ status: 'ok', time: result.rows[0].now });
});

export default app;
