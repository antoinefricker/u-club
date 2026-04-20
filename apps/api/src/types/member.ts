export type MemberGender = 'male' | 'female';

export interface Member {
  id: string;
  user_id: string | null;
  status_id: string | null;
  first_name: string;
  last_name: string;
  birthdate: string | null;
  gender: MemberGender;
  created_at: string;
  updated_at: string;
}
