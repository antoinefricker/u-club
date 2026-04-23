import { useState } from 'react';
import { IconMail } from '@tabler/icons-react';
import { PhoneInput } from '../forms/inputs/PhoneInput';
import {
  Alert,
  Anchor,
  Button,
  Grid,
  PasswordInput,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthContext } from '../auth/useAuthContext';
import { useUserUpdate, type UpdateUserPayload } from '../hooks/useUserUpdate';
import { emailValidation } from '../forms/validations/emailValidation';
import { phoneValidation } from '../forms/validations/phoneValidation';
import {
  passwordValidation,
  confirmPasswordValidation,
} from '../forms/validations/passwordValidation';

type AccountFormValues = UpdateUserPayload & {
  password: string;
  confirmPassword: string;
};

export function AccountEditForm() {
  const { user, updateUser } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useUserUpdate();

  const form = useForm<AccountFormValues>({
    initialValues: {
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      displayName: (v) =>
        v.trim().length > 0 ? null : 'Display name is required',
      email: emailValidation,
      phone: phoneValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    },
  });

  const handleSubmit = (values: AccountFormValues) => {
    setError(null);
    mutation.mutate(values, {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        form.setFieldValue('password', '');
        form.setFieldValue('confirmPassword', '');
        setShowPassword(false);
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
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Grid gutter="md">
        {error && (
          <Grid.Col span={12}>
            <Alert color="red" variant="light">
              {error}
            </Alert>
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Display name"
            required
            {...form.getInputProps('displayName')}
          />
        </Grid.Col>
        {user?.role !== 'user' && (
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput label="Role" value={user?.role} disabled />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label="Email"
            type="email"
            required
            leftSection={<IconMail size={16} />}
            {...form.getInputProps('email')}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <PhoneInput
            {...form.getInputProps('phone')}
            onChange={(v) => form.setFieldValue('phone', v)}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Textarea
            label="Bio"
            rows={3}
            resize="vertical"
            {...form.getInputProps('bio')}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Anchor
            component="button"
            type="button"
            size="sm"
            mb="xs"
            c="dark"
            fw="bold"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Cancel password change' : 'Change password'}
          </Anchor>
          {showPassword && (
            <Text size="sm" c="dimmed" mt={-10}>
              Leave blank to keep current password
            </Text>
          )}
        </Grid.Col>
        {showPassword && (
          <>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <PasswordInput
                label="New password"
                {...form.getInputProps('password')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <PasswordInput
                label="Confirm password"
                {...form.getInputProps('confirmPassword')}
              />
            </Grid.Col>
          </>
        )}

        <Grid.Col
          span={12}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button type="submit" color="success" loading={mutation.isPending}>
            Save changes
          </Button>
        </Grid.Col>
      </Grid>
    </form>
  );
}
