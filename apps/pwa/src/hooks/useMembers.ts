import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';

interface Member {
  id: string;
  statusId: string | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  license: string | null;
  gender: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

function useAuthHeaders() {
  const { token } = useAuth();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useMembers(teamId?: string) {
  const headers = useAuthHeaders();
  return useQuery<Member[]>({
    queryKey: ['members', teamId],
    queryFn: async () => {
      const url = teamId ? `/api/members?teamId=${teamId}` : '/api/members';
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
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
