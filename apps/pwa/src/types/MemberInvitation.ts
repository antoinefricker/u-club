export type InvitationType = 'self' | 'relative';

export interface MemberInvitation {
    id: string;
    memberId: string;
    invitedBy: string;
    email: string;
    type: InvitationType;
    description: string | null;
    expiresAt: string;
    createdAt: string;
    memberFirstName: string;
    memberLastName: string;
    invitedByDisplayName: string;
    invitedByEmail: string;
}
