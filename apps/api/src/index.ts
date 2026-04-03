import express, { Request, Response } from 'express';
import db from './db.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  const result = await db.query('SELECT NOW()');
  res.json({ status: 'ok', time: result.rows[0].now });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
