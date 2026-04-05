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
  onForgotPassword: () => void;
}

export function LoginForm({ onSwitchMode, onForgotPassword }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

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
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password';
      if (message === 'email not verified') {
        setUnverifiedEmail(values.email);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await fetch('/api/auth/verify_email_resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Stack align="center" mt="xl">
      <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack>
            <Title order={3} ta="center">
              Login
            </Title>

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            {unverifiedEmail && (
              <>
                <Alert color="orange" variant="light">
                  Please verify your email address. Check your inbox for the
                  confirmation link.
                </Alert>
                <Button
                  variant="light"
                  fullWidth
                  loading={resending}
                  onClick={handleResend}
                >
                  Resend confirmation email
                </Button>
              </>
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

            <Text size="sm" ta="right">
              <Anchor
                component="button"
                type="button"
                onClick={onForgotPassword}
              >
                Forgot password?
              </Anchor>
            </Text>

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
