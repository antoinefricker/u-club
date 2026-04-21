import { z } from 'zod';

export const createMemberSchema = z.object({
  firstName: z.string({ error: 'firstName is required' }),
  lastName: z.string({ error: 'lastName is required' }),
  gender: z.enum(['male', 'female', 'mixed'], {
    error: "gender must be 'male', 'female', or 'mixed'",
  }),
  statusId: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
});

export const updateMemberSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    gender: z
      .enum(['male', 'female', 'mixed'], {
        error: "gender must be 'male', 'female', or 'mixed'",
      })
      .optional(),
    statusId: z.string().nullable().optional(),
    birthdate: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
