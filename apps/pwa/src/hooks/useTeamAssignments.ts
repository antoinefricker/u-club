import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { TeamAssignment } from '../types/TeamAssignment';

interface UseTeamAssignmentsArgs extends PaginationArgs {
    userId?: string;
    memberId?: string;
}

export function useTeamAssignments(args: UseTeamAssignmentsArgs = {}) {
    const { token, user } = useAuthContext();
    const { page, itemsPerPage, memberId } = args;
    const userId = memberId ? args.userId : (args.userId ?? user?.id);
    return useQuery<Paginated<TeamAssignment>>({
        queryKey: ['team-assignments', { page, itemsPerPage, userId, memberId, token }],
        queryFn: async () => {
            const qs = buildListQueryString({
                page,
                itemsPerPage,
                userId,
                memberId,
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
        enabled: !!userId || !!memberId,
        placeholderData: keepPreviousData,
    });
}
