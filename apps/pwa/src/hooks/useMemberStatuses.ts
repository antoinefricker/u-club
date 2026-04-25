import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { MemberStatus } from '../types/MemberStatus';

function useAuthHeaders() {
    const { token } = useAuthContext();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export function useMemberStatuses(args: PaginationArgs = {}) {
    const { page, itemsPerPage } = args;
    const { token } = useAuthContext();
    return useQuery<Paginated<MemberStatus>>({
        queryKey: ['member-statuses', { page, itemsPerPage, token }],
        queryFn: async () => {
            const qs = buildListQueryString({ page, itemsPerPage });
            const res = await fetch(`/api/member-statuses${qs}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch member statuses');
            return res.json();
        },
        placeholderData: keepPreviousData,
    });
}

export function useMemberStatus(id: string) {
    const { token } = useAuthContext();
    return useQuery<MemberStatus>({
        queryKey: ['member-statuses', id, token],
        queryFn: async () => {
            const res = await fetch(`/api/member-statuses/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch member status');
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateMemberStatus() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { label: string }) => {
            const res = await fetch('/api/member-statuses', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to create member status');
            }
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-statuses'] }),
    });
}

export function useUpdateMemberStatus() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, label }: { id: string; label: string }) => {
            const res = await fetch(`/api/member-statuses/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ label }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to update member status');
            }
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-statuses'] }),
    });
}

export function useDeleteMemberStatus() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/member-statuses/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) throw new Error('Failed to delete member status');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-statuses'] }),
    });
}
