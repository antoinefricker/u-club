import { z } from 'zod';

export const createUserSchema = z.object({
  display_name: z.string({ required_error: 'display_name is required' }),
  email: z.string({ required_error: 'email is required' }),
  password: z.string({ required_error: 'password is required' }),
  bio: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    display_name: z.string().optional(),
    bio: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
