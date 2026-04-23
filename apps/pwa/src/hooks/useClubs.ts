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

interface Club {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

function useAuthHeaders() {
  const { token } = useAuthContext();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useClubs(args: PaginationArgs = {}) {
  const { page, itemsPerPage } = args;
  const headers = useAuthHeaders();
  return useQuery<Paginated<Club>>({
    queryKey: ['clubs', { page, itemsPerPage }],
    queryFn: async () => {
      const qs = buildListQueryString({ page, itemsPerPage });
      const res = await fetch(`/api/clubs${qs}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch clubs');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useClub(id: string) {
  const headers = useAuthHeaders();
  return useQuery<Club>({
    queryKey: ['clubs', id],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch club');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateClub() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Club>) => {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to create club');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}

export function useUpdateClub() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Club> & { id: string }) => {
      const res = await fetch(`/api/clubs/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to update club');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}

export function useDeleteClub() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clubs/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete club');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}
