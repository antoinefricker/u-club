import { z } from 'zod';

export const createUserMemberSchema = z.object({
  user_id: z.string({ error: 'user_id is required' }),
  member_id: z.string({ error: 'member_id is required' }),
  type: z.enum(['self', 'relative'], {
    error: "type must be 'self' or 'relative'",
  }),
  description: z.string().nullable().optional(),
});

export const updateUserMemberSchema = z
  .object({
    type: z
      .enum(['self', 'relative'], {
        error: "type must be 'self' or 'relative'",
      })
      .optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
