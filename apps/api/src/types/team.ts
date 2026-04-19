export type TeamGender = 'male' | 'female' | 'mixed';

export interface Team {
  id: string;
  club_id: string;
  category_id: string | null;
  label: string;
  gender: TeamGender;
  description: string | null;
  created_at: string;
  updated_at: string;
}
