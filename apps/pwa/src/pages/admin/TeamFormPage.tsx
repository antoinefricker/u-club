import { useEffect } from 'react';
import {
  Button,
  Grid,
  Group,
  Loader,
  NumberInput,
  Select,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../layout/FormWrapper';
import { PageTitle } from '../../layout/PageTitle';
import { useTeam, useCreateTeam, useUpdateTeam } from '../../hooks/useTeams';
import { useClubs } from '../../hooks/useClubs';

export function TeamFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: team, isLoading } = useTeam(id ?? '');
  const { data: clubs } = useClubs();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const clubOptions = clubs?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const form = useForm({
    initialValues: {
      label: '',
      clubId: '',
      year: new Date().getFullYear(),
      gender: '',
      description: '',
    },
    validate: {
      label: (v) => (v.trim() ? null : 'Label is required'),
      clubId: (v) => (v ? null : 'Club is required'),
      year: (v) => (v ? null : 'Year is required'),
      gender: (v) => (v ? null : 'Gender is required'),
    },
  });

  useEffect(() => {
    if (team) {
      form.setValues({
        label: team.label,
        clubId: team.clubId,
        year: team.year,
        gender: team.gender,
        description: team.description ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const handleSubmit = (values: typeof form.values) => {
    const payload = {
      ...values,
      description: values.description || null,
    };

    if (isEdit) {
      updateTeam.mutate(
        { id: id!, ...payload },
        {
          onSuccess: () => {
            notifications.show({
              title: 'Team updated',
              message: `"${values.label}" has been updated.`,
              color: 'green',
            });
            navigate('/admin/teams');
          },
        },
      );
    } else {
      createTeam.mutate(payload, {
        onSuccess: () => {
          notifications.show({
            title: 'Team created',
            message: `"${values.label}" has been created.`,
            color: 'green',
          });
          navigate('/admin/teams');
        },
      });
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <>
      <PageTitle label={isEdit ? 'Edit team' : 'New team'} />

      <FormWrapper>
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Label"
                placeholder="Team label"
                required
                {...form.getInputProps('label')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Club"
                placeholder="Select a club"
                data={clubOptions}
                required
                {...form.getInputProps('clubId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Year"
                placeholder="e.g. 2026"
                required
                {...form.getInputProps('year')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Gender"
                placeholder="Select gender"
                data={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'both', label: 'Both' },
                ]}
                required
                {...form.getInputProps('gender')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Optional description"
                {...form.getInputProps('description')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group>
                <Button
                  type="submit"
                  loading={createTeam.isPending || updateTeam.isPending}
                >
                  {isEdit ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => navigate('/admin/teams')}
                >
                  Cancel
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </FormWrapper>
    </>
  );
}
