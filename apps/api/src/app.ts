import express, { Request, Response } from 'express';
import db from './db.js';
import authRouter from './routes/auth/index.js';

const app = express();

app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  const result = await db.raw('SELECT NOW()');
  res.json({ status: 'ok', time: result.rows[0].now });
});

app.use('/auth', authRouter);

export default app;
