import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { TeamAssignment, TeamRole } from '../types/TeamAssignment';

interface UseTeamAssignmentsArgs extends PaginationArgs {
    userId?: string;
    memberId?: string;
    teamId?: string;
}

function useAuthHeaders() {
    const { token } = useAuthContext();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export function useTeamAssignments(args: UseTeamAssignmentsArgs = {}) {
    const { token, user } = useAuthContext();
    const { page, itemsPerPage, memberId, teamId } = args;
    const userId = memberId || teamId ? args.userId : (args.userId ?? user?.id);
    return useQuery<Paginated<TeamAssignment>>({
        queryKey: ['team-assignments', { page, itemsPerPage, userId, memberId, teamId, token }],
        queryFn: async () => {
            const qs = buildListQueryString({
                page,
                itemsPerPage,
                userId,
                memberId,
                teamId,
            });
            const res = await fetch(`/api/team-assignments${qs}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch team assignments');
            return res.json();
        },
        enabled: !!userId || !!memberId || !!teamId,
        placeholderData: keepPreviousData,
    });
}

export function useCreateTeamAssignment() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { teamId: string; memberId: string; role: TeamRole }) => {
            const res = await fetch('/api/team-assignments', {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to create team assignment');
            }
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-assignments'] }),
    });
}

export function useDeleteTeamAssignment() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/team-assignments/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) throw new Error('Failed to delete team assignment');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-assignments'] }),
    });
}
