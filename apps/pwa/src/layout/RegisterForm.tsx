import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Alert,
  Paper,
  Anchor,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';

interface RegisterFormProps {
  onSwitchMode: () => void;
}

export function RegisterForm({ onSwitchMode }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const form = useForm({
    initialValues: {
      display_name: '',
      email: '',
      password: '',
    },
    validate: {
      display_name: (v) => (v.length > 0 ? null : 'Display name is required'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) =>
        v.length >= 6 ? null : 'Password must be at least 6 characters',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Error creating account');
      }

      setRegisteredEmail(values.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await fetch('/api/auth/resend_confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <Stack align="center" mt="xl">
        <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
          <Stack>
            <Title order={3} ta="center">
              Check your email
            </Title>
            <Alert color="blue" variant="light">
              We sent a confirmation link to <strong>{registeredEmail}</strong>.
              Click the link to activate your account.
            </Alert>
            <Button
              variant="light"
              fullWidth
              loading={resending}
              onClick={handleResend}
            >
              Resend confirmation email
            </Button>
            <Text size="sm" ta="center">
              <Anchor component="button" type="button" onClick={onSwitchMode}>
                Back to login
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack align="center" mt="xl">
      <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Title order={3} ta="center">
              Create an account
            </Title>

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Display name"
              placeholder="Your display name"
              required
              {...form.getInputProps('display_name')}
            />

            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="6 characters minimum"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Create my account
            </Button>

            <Text size="sm" ta="center">
              Already have an account?{' '}
              <Anchor component="button" type="button" onClick={onSwitchMode}>
                Log in
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
