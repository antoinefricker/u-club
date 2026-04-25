import { z } from 'zod';

const teamRoleEnum = z.enum(['player', 'coach', 'assistant', 'sparring'], {
    error: 'role must be player, coach, assistant, or sparring',
});

export const createTeamAssignmentSchema = z.object({
    memberId: z.string({ error: 'memberId is required' }),
    role: teamRoleEnum,
});

export const updateTeamAssignmentSchema = z.object({
    role: teamRoleEnum,
});
