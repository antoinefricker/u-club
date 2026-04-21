import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import {
  buildListQueryString,
  type Paginated,
  type PaginationArgs,
} from './pagination';

interface MemberStatus {
  id: string;
  label: string;
}

function useAuthHeaders() {
  const { token } = useAuth();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useMemberStatuses(args: PaginationArgs = {}) {
  const { page, itemsPerPage } = args;
  const headers = useAuthHeaders();
  return useQuery<Paginated<MemberStatus>>({
    queryKey: ['member-statuses', { page, itemsPerPage }],
    queryFn: async () => {
      const qs = buildListQueryString({ page, itemsPerPage });
      const res = await fetch(`/api/member-statuses${qs}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch member statuses');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}
