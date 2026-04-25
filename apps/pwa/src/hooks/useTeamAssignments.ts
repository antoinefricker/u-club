import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import type { MemberTeamAssignment, TeamRole } from '../types/MemberTeamAssignment';

function useAuthHeaders() {
    const { token } = useAuthContext();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

export function useMemberTeamAssignments(memberId: string) {
    const { token } = useAuthContext();
    return useQuery<MemberTeamAssignment[]>({
        queryKey: ['team-assignments', { memberId, token }],
        queryFn: async () => {
            const res = await fetch(`/api/members/${memberId}/teams`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch team assignments');
            return res.json();
        },
        enabled: !!memberId,
    });
}

export function useCreateTeamAssignment() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ teamId, memberId, role }: { teamId: string; memberId: string; role: TeamRole }) => {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ memberId, role }),
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

export function useUpdateTeamAssignment() {
    const headers = useAuthHeaders();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ teamId, memberId, role }: { teamId: string; memberId: string; role: TeamRole }) => {
            const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ role }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to update team assignment');
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
        mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
            const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) throw new Error('Failed to delete team assignment');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-assignments'] }),
    });
}
