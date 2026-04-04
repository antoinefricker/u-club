import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Alert, Loader, Paper, Stack, Title } from '@mantine/core';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setError('Invalid confirmation link.');
      return;
    }

    fetch('/api/auth/confirm_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Confirmation failed');
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('access_token', data.access_token);
        navigate('/');
        window.location.reload();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Confirmation failed');
      });
  }, [searchParams, navigate]);

  return (
    <Stack align="center" mt="xl">
      <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <Stack align="center">
          <Title order={3}>Email Confirmation</Title>
          {error ? (
            <Alert color="red" variant="light" w="100%">
              {error}
            </Alert>
          ) : (
            <>
              <Loader />
              <span>Confirming your email...</span>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
