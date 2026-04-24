export type UserMemberType = 'self' | 'relative';

export interface UserMember {
    id: string;
    userId: string;
    memberId: string;
    type: UserMemberType;
    description: string | null;
    createdAt: string;
}
