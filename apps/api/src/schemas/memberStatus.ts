import { z } from 'zod';

export const createMemberStatusSchema = z.object({
    label: z.string({ error: 'label is required' }),
});

export const updateMemberStatusSchema = z
    .object({
        label: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'no valid fields to update',
    });
