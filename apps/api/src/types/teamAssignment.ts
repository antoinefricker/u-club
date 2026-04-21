export type TeamRole = 'player' | 'coach' | 'assistant' | 'sparring';

export interface TeamAssignment {
  id: string;
  teamId: string;
  memberId: string;
  role: TeamRole;
  createdAt: string;
}
