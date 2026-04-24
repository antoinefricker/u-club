import { z } from 'zod';

export const createTeamCategorySchema = z.object({
    clubId: z.uuid({ error: 'clubId must be a valid uuid' }),
    label: z.string({ error: 'label is required' }),
});

export const updateTeamCategorySchema = z
    .object({
        label: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'no valid fields to update',
    });
