import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';

interface UserMember {
  id: string;
  userId: string;
  memberId: string;
  type: string;
  description: string | null;
  createdAt: string;
  memberFirstName: string;
  memberLastName: string;
}

function useAuthHeaders() {
  const { token } = useAuth();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useUserMembers() {
  const headers = useAuthHeaders();
  return useQuery<UserMember[]>({
    queryKey: ['user-members'],
    queryFn: async () => {
      const res = await fetch('/api/user-members', { headers });
      if (!res.ok) throw new Error('Failed to fetch relationships');
      return res.json();
    },
  });
}

export function useUpdateUserMember() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      type?: string;
      description?: string | null;
    }) => {
      const res = await fetch(`/api/user-members/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to update');
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['user-members'] }),
  });
}

export function useDeleteUserMember() {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user-members/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['user-members'] }),
  });
}
