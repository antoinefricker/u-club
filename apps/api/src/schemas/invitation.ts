import { z } from 'zod';

export const createInvitationSchema = z.object({
  member_id: z.string({ error: 'member_id is required' }),
  email: z.string({ error: 'email is required' }),
  type: z.enum(['self', 'relative'], {
    error: "type must be 'self' or 'relative'",
  }),
  description: z.string().nullable().optional(),
});

export const acceptInvitationSchema = z.object({
  description: z.string().nullable().optional(),
  type: z
    .enum(['self', 'relative'], { error: "type must be 'self' or 'relative'" })
    .optional(),
});
