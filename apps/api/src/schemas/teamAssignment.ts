import { z } from 'zod';

export const createTeamAssignmentSchema = z.object({
  member_id: z.string({ required_error: 'member_id is required' }),
  role: z.enum(['player', 'coach', 'assistant', 'sparring'], {
    required_error: 'role is required',
    invalid_type_error: 'role must be player, coach, assistant, or sparring',
  }),
});
