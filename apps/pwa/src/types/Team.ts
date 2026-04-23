export type TeamGender = 'male' | 'female' | 'mixed';

export interface Team {
  id: string;
  clubId: string;
  categoryId: string | null;
  label: string;
  gender: TeamGender;
  description: string | null;
  categoryLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export const TEAM_GENDER_LABELS: Record<TeamGender, string> = {
  male: 'Male',
  female: 'Female',
  mixed: 'Mixed',
};

export const TEAM_GENDER_OPTIONS: { value: TeamGender; label: string }[] = (
  Object.keys(TEAM_GENDER_LABELS) as TeamGender[]
).map((value) => ({ value, label: TEAM_GENDER_LABELS[value] }));
