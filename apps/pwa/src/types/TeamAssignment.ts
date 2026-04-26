export type TeamRole = 'player' | 'coach' | 'assistant' | 'sparring';

export interface TeamAssignment {
    id: string;
    teamId: string;
    teamLabel: string;
    teamGender: 'male' | 'female' | 'mixed';
    teamCategoryLabel: string | null;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    role: TeamRole;
    createdAt: string;
    updatedAt: string;
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
    player: 'Player',
    coach: 'Coach',
    assistant: 'Assistant',
    sparring: 'Sparring',
};

export const TEAM_ROLE_OPTIONS: { value: TeamRole; label: string }[] = (
    Object.keys(TEAM_ROLE_LABELS) as TeamRole[]
).map((value) => ({
    value,
    label: TEAM_ROLE_LABELS[value],
}));
