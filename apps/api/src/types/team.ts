export const TEAM_GENDERS = ['male', 'female', 'mixed'] as const;
export type TeamGender = (typeof TEAM_GENDERS)[number];

export interface Team {
    id: string;
    clubId: string;
    categoryId: string | null;
    label: string;
    gender: TeamGender;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}
