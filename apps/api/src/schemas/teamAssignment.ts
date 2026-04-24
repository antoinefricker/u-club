import { z } from 'zod';

export const createTeamAssignmentSchema = z.object({
    memberId: z.string({ error: 'memberId is required' }),
    role: z.enum(['player', 'coach', 'assistant', 'sparring'], {
        error: 'role must be player, coach, assistant, or sparring',
    }),
});
