import { useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Title,
  Alert,
  Paper,
  Anchor,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { emailValidation } from '../utils/formValidations/emailValidation';

interface ForgotPasswordFormProps {
  onSwitchMode: () => void;
}

export function ForgotPasswordForm({ onSwitchMode }: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: emailValidation,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Stack align="center" mt="xl">
        <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
          <Stack>
            <Title order={3} ta="center">
              Check your email
            </Title>
            <Alert color="blue" variant="light">
              If an account exists for that email, we sent a password reset
              link. Check your inbox.
            </Alert>
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

            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              required
              {...form.getInputProps('email')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>

            <Text size="sm" ta="center">
              <Anchor component="button" type="button" onClick={onSwitchMode}>
                Back to login
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
