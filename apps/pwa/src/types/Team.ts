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
