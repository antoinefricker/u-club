import { z } from 'zod';

const birthdateSchema = z.iso.date({ error: 'birthdate must be a YYYY-MM-DD date' }).nullable().optional();

export const createMemberSchema = z.object({
    firstName: z.string({ error: 'firstName is required' }),
    lastName: z.string({ error: 'lastName is required' }),
    gender: z.enum(['male', 'female'], {
        error: "gender must be 'male' or 'female'",
    }),
    statusId: z.string().nullable().optional(),
    birthdate: birthdateSchema,
});

export const updateMemberSchema = z
    .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        gender: z
            .enum(['male', 'female'], {
                error: "gender must be 'male' or 'female'",
            })
            .optional(),
        statusId: z.string().nullable().optional(),
        birthdate: birthdateSchema,
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'no valid fields to update',
    });
