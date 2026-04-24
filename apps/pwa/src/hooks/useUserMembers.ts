import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { UserMember } from '../types/UserMember';

interface UseUserMembersArgs extends PaginationArgs {
    userId?: string;
    memberId?: string;
}

function useAuthHeaders() {
    const { token } = useAuthContext();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export function useUserMembers(args: UseUserMembersArgs = {}) {
    const { token, user } = useAuthContext();
    const { page, itemsPerPage, memberId } = args;
    const userId = memberId ? args.userId : (args.userId ?? user?.id);
    return useQuery<Paginated<UserMember>>({
        queryKey: ['user-members', { page, itemsPerPage, userId, memberId, token }],
        queryFn: async () => {
            const qs = buildListQueryString({
                page,
                itemsPerPage,
                userId,
                memberId,
            });
            const res = await fetch(`/api/user-members${qs}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch relationships');
            return res.json();
        },
        enabled: !!userId || !!memberId,
        placeholderData: keepPreviousData,
    });
}

export function useUpdateUserMember() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: string; type?: string; description?: string | null }) => {
            const res = await fetch(`/api/user-members/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to update');
            }
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-members'] }),
    });
}

export function useDeleteUserMember() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/user-members/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-members'] }),
    });
}
