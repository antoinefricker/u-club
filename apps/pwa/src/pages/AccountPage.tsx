import { useState } from 'react';
import {
  Alert,
  Button,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../auth/useAuth';
import { useUserUpdate } from '../hooks/useUserUpdate';

interface AccountFormValues {
  display_name: string;
  email: string;
  phone: string;
  bio: string;
  password: string;
}

export function AccountPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const mutation = useUserUpdate();

  const form = useForm<AccountFormValues>({
    initialValues: {
      display_name: user?.display_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
      password: '',
    },
    validate: {
      display_name: (v) =>
        v.trim().length > 0 ? null : 'Display name is required',
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = (values: AccountFormValues) => {
    setError(null);
    mutation.mutate(values, {
      onSuccess: () => {
        form.setFieldValue('password', '');
        notifications.show({
          title: 'Account updated',
          message: 'Your changes have been saved.',
          color: 'green',
        });
      },
      onError: (err: Error) => {
        setError(err.message);
      },
    });
  };

  return (
    <Stack align="center">
      <Paper shadow="sm" p="xl" radius="md" w="100%" maw={500}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Title order={2} ta="center">
              My Account
            </Title>

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Display name"
              required
              {...form.getInputProps('display_name')}
            />

            <TextInput
              label="Email"
              type="email"
              required
              {...form.getInputProps('email')}
            />

            <TextInput label="Phone" {...form.getInputProps('phone')} />

            <Textarea
              label="Bio"
              autosize
              minRows={2}
              maxRows={5}
              {...form.getInputProps('bio')}
            />

            <PasswordInput
              label="New password"
              description="Leave blank to keep current password"
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={mutation.isPending}>
              Save changes
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
