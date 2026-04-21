import { z } from 'zod';

export const createUserSchema = z.object({
  displayName: z.string({ error: 'displayName is required' }),
  email: z.string({ error: 'email is required' }),
  password: z.string({ error: 'password is required' }),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    displayName: z.string().optional(),
    bio: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
