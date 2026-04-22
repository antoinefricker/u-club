import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import {
  buildListQueryString,
  type Paginated,
  type PaginationArgs,
} from './pagination';

interface TeamCategory {
  id: string;
  clubId: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

interface UseTeamCategoriesArgs extends PaginationArgs {
  clubId?: string;
}

function useAuthHeaders() {
  const { token } = useAuth();
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
    enabled: !!clubId,
    placeholderData: keepPreviousData,
  });
}
