import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns the API status and current database time.
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 time:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', async (req: Request, res: Response) => {
  const result = await db.raw('SELECT NOW()');
  res.json({ status: 'ok', time: result.rows[0].now });
});

export default router;
