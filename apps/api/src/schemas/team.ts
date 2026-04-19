import { z } from 'zod';

export const createTeamSchema = z.object({
  club_id: z.string({ error: 'club_id is required' }),
  label: z.string({ error: 'label is required' }),
  gender: z.enum(['male', 'female', 'mixed'], {
    error: 'gender must be male, female, or mixed',
  }),
  description: z.string().nullable().optional(),
});

export const updateTeamSchema = z
  .object({
    label: z.string().optional(),
    gender: z
      .enum(['male', 'female', 'mixed'], {
        error: 'gender must be male, female, or mixed',
      })
      .optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
