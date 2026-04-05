import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ error: 'email is required' }),
  password: z.string({ error: 'password is required' }),
});

export const emailLoginSchema = z.object({
  email: z.string({ error: 'email is required' }),
});

export const confirmEmailSchema = z.object({
  token: z.string({ error: 'token is required' }),
  email: z.string({ error: 'email is required' }),
});

export const resendConfirmationSchema = z.object({
  email: z.string({ error: 'email is required' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ error: 'email is required' }),
});

export const resetPasswordSchema = z.object({
  token: z.string({ error: 'token is required' }),
  email: z.string({ error: 'email is required' }),
  password: z.string({ error: 'password is required' }),
});
