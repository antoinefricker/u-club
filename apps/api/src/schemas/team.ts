import { z } from 'zod';

export const createTeamSchema = z.object({
  club_id: z.string({ error: 'club_id is required' }),
  label: z.string({ error: 'label is required' }),
  year: z.number({ error: 'year is required' }),
  gender: z.enum(['male', 'female', 'both'], {
    error: 'gender must be male, female, or both',
  }),
  description: z.string().nullable().optional(),
});

export const updateTeamSchema = z
  .object({
    label: z.string().optional(),
    year: z.number().optional(),
    gender: z
      .enum(['male', 'female', 'both'], {
        error: 'gender must be male, female, or both',
      })
      .optional(),
    description: z.string().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
