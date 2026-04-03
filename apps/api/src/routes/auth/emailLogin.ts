import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import db from '../../db.js';
import mailer from '../../mailer.js';

const router = Router();

router.post('/email_login', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const user = await db('users').where({ email }).first();
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    res.json({ message: 'login email sent' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db('login_tokens').insert({
    email,
    token,
    expires_at: expiresAt,
  });

  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'noreply@u-club.app',
    to: email,
    subject: 'Your login code',
    text: `Your login link is: ${token}\n\nThis token expires in 15 minutes.`,
  });

  res.json({ message: 'login email sent' });
});

export default router;
