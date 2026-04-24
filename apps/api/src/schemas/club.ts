import { z } from 'zod';

export const createClubSchema = z.object({
    name: z.string({ error: 'name is required' }),
    code: z.string({ error: 'code is required' }),
    description: z.string().nullable().optional(),
});

export const updateClubSchema = z
    .object({
        name: z.string().optional(),
        code: z.string().optional(),
        description: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'no valid fields to update',
    });
