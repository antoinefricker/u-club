import { z } from 'zod';

export const teamRoleSchema = z.enum(['player', 'coach', 'assistant', 'sparring'], {
    error: 'role must be player, coach, assistant, or sparring',
});

export const createTeamAssignmentSchema = z.object({
    teamId: z.uuid({ error: 'teamId must be a UUID' }),
    memberId: z.uuid({ error: 'memberId must be a UUID' }),
    role: teamRoleSchema,
});

export const updateTeamAssignmentSchema = z
    .object({
        teamId: z.uuid({ error: 'teamId must be a UUID' }).optional(),
        role: teamRoleSchema.optional(),
    })
    .refine((data) => data.teamId !== undefined || data.role !== undefined, {
        message: 'at least one of teamId or role is required',
    });
