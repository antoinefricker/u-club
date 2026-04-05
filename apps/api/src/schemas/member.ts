import { z } from 'zod';

export const createMemberSchema = z.object({
  first_name: z.string({ error: 'first_name is required' }),
  last_name: z.string({ error: 'last_name is required' }),
  gender: z.enum(['male', 'female'], {
    error: "gender must be 'male' or 'female'",
  }),
  year: z.number({
    error: 'year is required',
  }),
  user_id: z.string().nullable().optional(),
  status_id: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
});

export const updateMemberSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z
      .enum(['male', 'female'], {
        error: "gender must be 'male' or 'female'",
      })
      .optional(),
    year: z.number().optional(),
    user_id: z.string().nullable().optional(),
    status_id: z.string().nullable().optional(),
    birth_date: z.string().nullable().optional(),
    license: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
