import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'email is required' }),
  password: z.string({ required_error: 'password is required' }),
});

export const emailLoginSchema = z.object({
  email: z.string({ required_error: 'email is required' }),
});

export const confirmEmailSchema = z.object({
  token: z.string({ required_error: 'token is required' }),
  email: z.string({ required_error: 'email is required' }),
});

export const resendConfirmationSchema = z.object({
  email: z.string({ required_error: 'email is required' }),
});
