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

interface Member {
  id: string;
  statusId: string | null;
  statusLabel: string | null;
  firstName: string;
  lastName: string;
  birthdate: string | null;
  gender: string;
  createdAt: string;
  updatedAt: string;
}

interface UseMembersArgs extends PaginationArgs {
  teamId?: string;
  search?: string;
}

function useAuthHeaders() {
  const { token } = useAuthContext();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useMembers(args: UseMembersArgs = {}) {
  const { page, itemsPerPage, teamId, search } = args;
  const headers = useAuthHeaders();
  return useQuery<Paginated<Member>>({
    queryKey: ['members', { page, itemsPerPage, teamId, search }],
    queryFn: async () => {
      const qs = buildListQueryString({ page, itemsPerPage, teamId, search });
      const res = await fetch(`/api/members${qs}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useMember(id: string) {
  const headers = useAuthHeaders();
  return useQuery<Member>({
    queryKey: ['members', 'detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch member');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Member>) => {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to create member');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMember() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Member> & { id: string }) => {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to update member');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useDeleteMember() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete member');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });
}
