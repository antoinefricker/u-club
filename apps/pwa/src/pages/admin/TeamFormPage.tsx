import { useEffect } from 'react';
import {
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router-dom';
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
    <Stack>
      <Title order={2}>{isEdit ? 'Edit team' : 'New team'}</Title>

      <Paper p="lg" shadow="xs" withBorder maw={600}>
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Stack>
            <TextInput
              label="Label"
              placeholder="Team label"
              required
              {...form.getInputProps('label')}
            />
            <Select
              label="Club"
              placeholder="Select a club"
              data={clubOptions}
              required
              {...form.getInputProps('clubId')}
            />
            <NumberInput
              label="Year"
              placeholder="e.g. 2026"
              required
              {...form.getInputProps('year')}
            />
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
            <Textarea
              label="Description"
              placeholder="Optional description"
              {...form.getInputProps('description')}
            />
            <Group>
              <Button
                type="submit"
                loading={createTeam.isPending || updateTeam.isPending}
              >
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button variant="subtle" onClick={() => navigate('/admin/teams')}>
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
