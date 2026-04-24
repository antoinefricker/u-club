import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';

export interface CreateInvitationInput {
    memberId: string;
    email: string;
    type: 'self' | 'relative';
    description?: string | null;
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
