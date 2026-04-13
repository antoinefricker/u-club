import { z } from 'zod';

export const createMemberSchema = z.object({
  first_name: z.string({ error: 'first_name is required' }),
  last_name: z.string({ error: 'last_name is required' }),
  gender: z.enum(['male', 'female', 'mixed'], {
    error: "gender must be 'male', 'female', or 'mixed'",
  }),
  status_id: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
});

export const updateMemberSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z
      .enum(['male', 'female', 'mixed'], {
        error: "gender must be 'male', 'female', or 'mixed'",
      })
      .optional(),
    status_id: z.string().nullable().optional(),
    birthdate: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
