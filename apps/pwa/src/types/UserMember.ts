export interface UserMember {
    id: string;
    userId: string;
    memberId: string;
    type: string;
    description: string | null;
    createdAt: string;
    memberFirstName: string;
    memberLastName: string;
    userDisplayName: string;
    userEmail: string;
}
