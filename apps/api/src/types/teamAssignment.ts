export type TeamRole = 'player' | 'coach' | 'assistant' | 'sparring';

export interface TeamAssignment {
  id: string;
  team_id: string;
  member_id: string;
  role: TeamRole;
  created_at: string;
}
