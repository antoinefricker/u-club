import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuthContext } from '../auth/useAuthContext';
import { buildListQueryString, type Paginated, type PaginationArgs } from '../utils/pagination';
import type { MemberStatus } from '../types/MemberStatus';

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
