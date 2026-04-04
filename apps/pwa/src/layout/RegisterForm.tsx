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
import { useAuth } from '../auth/useAuth';

interface RegisterFormProps {
  onSwitchMode: () => void;
}

export function RegisterForm({ onSwitchMode }: RegisterFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Auto-login after successful registration
      await login(values.email, values.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

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
