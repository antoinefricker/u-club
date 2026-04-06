import { useEffect } from 'react';
import {
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../layout/FormWrapper';
import { PageTitle } from '../../layout/PageTitle';
import {
  useMember,
  useCreateMember,
  useUpdateMember,
} from '../../hooks/useMembers';

export function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: member, isLoading } = useMember(id ?? '');
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      year: new Date().getFullYear(),
      birthDate: '',
      license: '',
    },
    validate: {
      firstName: (v) => (v.trim() ? null : 'First name is required'),
      lastName: (v) => (v.trim() ? null : 'Last name is required'),
      gender: (v) => (v ? null : 'Gender is required'),
      year: (v) => (v ? null : 'Year is required'),
    },
  });

  useEffect(() => {
    if (member) {
      form.setValues({
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        year: member.year,
        birthDate: member.birthDate ?? '',
        license: member.license ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const handleSubmit = (values: typeof form.values) => {
    const payload = {
      ...values,
      birthDate: values.birthDate || null,
      license: values.license || null,
    };

    if (isEdit) {
      updateMember.mutate(
        { id: id!, ...payload },
        {
          onSuccess: () => {
            notifications.show({
              title: 'Member updated',
              message: `"${values.firstName} ${values.lastName}" has been updated.`,
              color: 'green',
            });
            navigate('/admin/members');
          },
        },
      );
    } else {
      createMember.mutate(payload, {
        onSuccess: () => {
          notifications.show({
            title: 'Member created',
            message: `"${values.firstName} ${values.lastName}" has been created.`,
            color: 'green',
          });
          navigate('/admin/members');
        },
      });
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <>
      <PageTitle label={isEdit ? 'Edit member' : 'New member'} />

      <FormWrapper>
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack>
            <TextInput
              label="First name"
              placeholder="First name"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last name"
              placeholder="Last name"
              required
              {...form.getInputProps('lastName')}
            />
            <Select
              label="Gender"
              placeholder="Select gender"
              data={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              required
              {...form.getInputProps('gender')}
            />
            <NumberInput
              label="Year"
              placeholder="e.g. 2026"
              required
              {...form.getInputProps('year')}
            />
            <TextInput
              label="Birth date"
              type="date"
              {...form.getInputProps('birthDate')}
            />
            <TextInput
              label="License"
              placeholder="Optional license number"
              {...form.getInputProps('license')}
            />
            <Group>
              <Button
                type="submit"
                loading={createMember.isPending || updateMember.isPending}
              >
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="subtle"
                onClick={() => navigate('/admin/members')}
              >
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </FormWrapper>
    </>
  );
}
