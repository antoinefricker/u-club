export type UserMemberType = 'self' | 'relative';

export interface UserMember {
  id: string;
  user_id: string;
  member_id: string;
  type: UserMemberType;
  description: string | null;
  created_at: string;
}
