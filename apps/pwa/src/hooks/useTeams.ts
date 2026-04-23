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
} from './pagination';

export type TeamGender = 'male' | 'female' | 'mixed';

interface Team {
  id: string;
  clubId: string;
  categoryId: string | null;
  label: string;
  gender: TeamGender;
  description: string | null;
  categoryLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseTeamsArgs extends PaginationArgs {
  clubId?: string;
  categoryId?: string;
  gender?: TeamGender;
}

function useAuthHeaders() {
  const { token } = useAuthContext();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useTeams(args: UseTeamsArgs = {}) {
  const { page, itemsPerPage, clubId, categoryId, gender } = args;
  const headers = useAuthHeaders();
  return useQuery<Paginated<Team>>({
    queryKey: ['teams', { page, itemsPerPage, clubId, categoryId, gender }],
    queryFn: async () => {
      const qs = buildListQueryString({
        page,
        itemsPerPage,
        clubId,
        categoryId,
        gender,
      });
      const res = await fetch(`/api/teams${qs}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useTeam(id: string) {
  const headers = useAuthHeaders();
  return useQuery<Team>({
    queryKey: ['teams', 'detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Team>) => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to create team');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useUpdateTeam() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Team> & { id: string }) => {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to update team');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useDeleteTeam() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete team');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}
