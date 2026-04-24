import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string({ error: 'email is required' }),
    password: z.string({ error: 'password is required' }),
});

export const magicLinkSchema = z.object({
    email: z.string({ error: 'email is required' }),
});

export const verifyEmailSchema = z.object({
    token: z.string({ error: 'token is required' }),
    email: z.string({ error: 'email is required' }),
});

export const verifyEmailResendSchema = z.object({
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
