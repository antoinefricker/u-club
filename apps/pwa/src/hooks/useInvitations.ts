import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { InvitationType, MemberInvitation } from '../types/MemberInvitation';

export interface CreateInvitationInput {
    memberId: string;
    email: string;
    type: InvitationType;
    description?: string | null;
}

interface UsePendingInvitationsArgs extends PaginationArgs {
    userId?: string;
    memberId?: string;
}

export function usePendingInvitations({ userId, memberId, page, itemsPerPage }: UsePendingInvitationsArgs) {
    const { token } = useAuthContext();
    return useQuery<Paginated<MemberInvitation>>({
        queryKey: ['invitations', { userId, memberId, page, itemsPerPage, token }],
        queryFn: async () => {
            const qs = buildListQueryString({
                userId,
                memberId,
                page,
                itemsPerPage,
            });
            const res = await fetch(`/api/invitations${qs}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to load invitations');
            }
            return res.json();
        },
        enabled: !!userId || !!memberId,
        placeholderData: keepPreviousData,
    });
}

export function useDeleteInvitation() {
    const { token } = useAuthContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/invitations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to cancel invitation');
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
    });
}

export interface InvitationByToken {
    id: string;
    email: string;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    type: InvitationType;
    description: string | null;
    expiresAt: string;
}

export interface InvitationByTokenResponse {
    invitation: InvitationByToken;
    userExists: boolean;
}

export interface RegisterAndAcceptInput {
    displayName: string;
    password: string;
}

export function useCreateInvitation() {
    const { token } = useAuthContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateInvitationInput) => {
            const res = await fetch('/api/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to send invitation');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-members'] });
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
        },
    });
}

export function useInvitationByToken(invitationToken: string | null) {
    return useQuery<InvitationByTokenResponse>({
        queryKey: ['invitation-by-token', invitationToken],
        queryFn: async () => {
            const res = await fetch(`/api/invitations/by-token/${invitationToken}`);
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to load invitation');
            }
            return res.json();
        },
        enabled: !!invitationToken,
        retry: false,
    });
}

export function useRegisterAndAcceptInvitation(invitationToken: string | null) {
    return useMutation({
        mutationFn: async (data: RegisterAndAcceptInput) => {
            const res = await fetch(`/api/invitations/by-token/${invitationToken}/register-and-accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to register');
            }
            return res.json() as Promise<{ accessToken: string }>;
        },
    });
}
