export type MemberGender = 'male' | 'female';

export interface Member {
  id: string;
  userId: string | null;
  statusId: string | null;
  firstName: string;
  lastName: string;
  birthdate: string | null;
  gender: MemberGender;
  createdAt: string;
  updatedAt: string;
}
