import { z } from 'zod';
import { TEAM_GENDERS } from '../types/team.js';

const teamGenderSchema = z.enum(TEAM_GENDERS, {
    error: 'gender must be male, female, or mixed',
});

export const createTeamSchema = z.object({
    clubId: z.string({ error: 'clubId is required' }),
    label: z.string({ error: 'label is required' }),
    gender: teamGenderSchema,
    description: z.string().nullable().optional(),
    categoryId: z.uuid({ error: 'categoryId must be a valid uuid' }).nullable().optional(),
});

export const updateTeamSchema = z
    .object({
        label: z.string().optional(),
        gender: teamGenderSchema.optional(),
        description: z.string().nullable().optional(),
        categoryId: z.uuid({ error: 'categoryId must be a valid uuid' }).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'no valid fields to update',
    });
