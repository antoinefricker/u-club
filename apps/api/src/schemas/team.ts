import { z } from 'zod';

export const createTeamSchema = z.object({
  club_id: z.string({ required_error: 'club_id is required' }),
  label: z.string({ required_error: 'label is required' }),
  year: z.number({ required_error: 'year is required' }),
  gender: z.enum(['male', 'female', 'both'], {
    required_error: 'gender is required',
    invalid_type_error: 'gender must be male, female, or both',
  }),
  description: z.string().nullable().optional(),
});

export const updateTeamSchema = z
  .object({
    label: z.string().optional(),
    year: z.number().optional(),
    gender: z
      .enum(['male', 'female', 'both'], {
        invalid_type_error: 'gender must be male, female, or both',
      })
      .optional(),
    description: z.string().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no valid fields to update',
  });
