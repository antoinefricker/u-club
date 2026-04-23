import { useEffect } from 'react';
import {
  Button,
  Grid,
  Group,
  Loader,
  Select,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import {
  useMember,
  useCreateMember,
  useUpdateMember,
} from '../../hooks/useMembers';
import { useMemberStatuses } from '../../hooks/useMemberStatuses';
import { MEMBER_GENDER_OPTIONS, type MemberGender } from '../../types/Member';
import { UserRelationships } from '../../components/admin/user/UserRelationships';

export function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: member, isLoading } = useMember(id ?? '');
  const { data: statusesData } = useMemberStatuses({ itemsPerPage: 100 });
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const statusOptions =
    statusesData?.data.map((s) => ({ value: s.id, label: s.label })) ?? [];

  const form = useForm<{
    firstName: string;
    lastName: string;
    gender: MemberGender | '';
    birthdate: string;
    statusId: string;
  }>({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      birthdate: '',
      statusId: '',
    },
    validate: {
      firstName: (v) => (v.trim() ? null : 'First name is required'),
      lastName: (v) => (v.trim() ? null : 'Last name is required'),
      gender: (v) => (v ? null : 'Gender is required'),
    },
  });

  useEffect(() => {
    if (member) {
      form.setValues({
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        birthdate: member.birthdate
          ? dayjs(member.birthdate).format('YYYY-MM-DD')
          : '',
        statusId: member.statusId ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const handleSubmit = (values: typeof form.values) => {
    const payload = {
      ...values,
      gender: values.gender as MemberGender,
      birthdate: values.birthdate || null,
      statusId: values.statusId || null,
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
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="First name"
                placeholder="First name"
                required
                {...form.getInputProps('firstName')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Last name"
                placeholder="Last name"
                required
                {...form.getInputProps('lastName')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Gender"
                placeholder="Select gender"
                data={MEMBER_GENDER_OPTIONS}
                required
                {...form.getInputProps('gender')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Birth date"
                type="date"
                {...form.getInputProps('birthdate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select
                label="Status"
                placeholder="No status"
                data={statusOptions}
                clearable
                {...form.getInputProps('statusId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 1 }}></Grid.Col>
            <Grid.Col span={12}>
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
            </Grid.Col>
          </Grid>
        </form>
      </FormWrapper>
      <FormWrapper>
        <Title order={3} mt="xl" mb="md">
          Family & members
        </Title>
        <UserRelationships memberId={member?.id} useUserPointOfView={false} />
      </FormWrapper>
    </>
  );
}
