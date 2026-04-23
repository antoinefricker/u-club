import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  PasswordInput,
  Button,
  Stack,
  Title,
  Alert,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { confirmPasswordValidation } from '../utils/formValidations/passwordValidation';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const isValid = Boolean(token && email);

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (v) =>
        v.length >= 6 ? null : 'Password must be at least 6 characters',
      confirmPassword: confirmPasswordValidation,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password: values.password }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Password reset failed');
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack align="center" mt="xl">
      <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        {!isValid ? (
          <Stack align="center">
            <Title order={3}>Reset Password</Title>
            <Alert color="red" variant="light" w="100%">
              Invalid reset link.
            </Alert>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
            <Stack>
              <Title order={3} ta="center">
                Reset your password
              </Title>

              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              <PasswordInput
                label="New password"
                placeholder="6 characters minimum"
                required
                {...form.getInputProps('password')}
              />

              <PasswordInput
                label="Confirm password"
                placeholder="Repeat your password"
                required
                {...form.getInputProps('confirmPassword')}
              />

              <Button type="submit" fullWidth loading={loading}>
                Reset password
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Stack>
  );
}
