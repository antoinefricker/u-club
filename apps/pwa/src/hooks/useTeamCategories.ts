import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import {
    buildListQueryString,
    type Paginated,
    type PaginationArgs,
} from '../utils/pagination';
import type { TeamCategory } from '../types/TeamCategory';

interface UseTeamCategoriesArgs extends PaginationArgs {
    clubId?: string;
}

function useAuthHeaders() {
    const { token } = useAuthContext();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export function useTeamCategories(args: UseTeamCategoriesArgs = {}) {
    const { page, itemsPerPage, clubId } = args;
    const headers = useAuthHeaders();
    return useQuery<Paginated<TeamCategory>>({
        queryKey: ['team-categories', { page, itemsPerPage, clubId }],
        queryFn: async () => {
            const qs = buildListQueryString({ page, itemsPerPage, clubId });
            const res = await fetch(`/api/team-categories${qs}`, { headers });
            if (!res.ok) throw new Error('Failed to fetch team categories');
            return res.json();
        },
        placeholderData: keepPreviousData,
    });
}

export function useTeamCategory(id: string) {
    const headers = useAuthHeaders();
    return useQuery<TeamCategory>({
        queryKey: ['team-categories', id],
        queryFn: async () => {
            const res = await fetch(`/api/team-categories/${id}`, { headers });
            if (!res.ok) throw new Error('Failed to fetch team category');
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateTeamCategory() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { clubId: string; label: string }) => {
            const res = await fetch('/api/team-categories', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to create team category');
            }
            return res.json();
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['team-categories'] }),
    });
}

export function useUpdateTeamCategory() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, label }: { id: string; label: string }) => {
            const res = await fetch(`/api/team-categories/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ label }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to update team category');
            }
            return res.json();
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['team-categories'] }),
    });
}

export function useDeleteTeamCategory() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/team-categories/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) throw new Error('Failed to delete team category');
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['team-categories'] }),
    });
}
