import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';

interface UpdateUserPayload {
  display_name: string;
  email: string;
  phone: string;
  bio: string;
  password?: string;
}

export function useUserUpdate() {
  const { user, token } = useAuth();

  return useMutation({
    mutationFn: async (values: UpdateUserPayload) => {
      const body: Record<string, string> = {
        display_name: values.display_name,
        email: values.email,
        phone: values.phone,
        bio: values.bio,
      };
      if (values.password) {
        body.password = values.password;
      }

      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update account');
      }

      return res.json();
    },
  });
}
