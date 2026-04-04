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

interface LoginFormProps {
  onSwitchMode: () => void;
}

export function LoginForm({ onSwitchMode }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid email or password',
      );
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
              Login
            </Title>

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Connect
            </Button>

            <Text size="sm" ta="center">
              No account?{' '}
              <Anchor component="button" type="button" onClick={onSwitchMode}>
                Create an account
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
