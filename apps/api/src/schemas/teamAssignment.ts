import { z } from 'zod';

export const createTeamAssignmentSchema = z.object({
  member_id: z.string({ error: 'member_id is required' }),
  role: z.enum(['player', 'coach', 'assistant', 'sparring'], {
    error: 'role must be player, coach, assistant, or sparring',
  }),
});
