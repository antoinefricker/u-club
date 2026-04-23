import { useEffect } from 'react';
import { Button, Grid, Group, Loader, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import {
  useTeamCategory,
  useCreateTeamCategory,
  useUpdateTeamCategory,
} from '../../hooks/useTeamCategories';
import { useClubs } from '../../hooks/useClubs';

export function TeamCategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: category, isLoading } = useTeamCategory(id ?? '');
  const { data: clubsData } = useClubs({ itemsPerPage: 100 });
  const createCategory = useCreateTeamCategory();
  const updateCategory = useUpdateTeamCategory();

  const clubOptions =
    clubsData?.data.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const form = useForm({
    initialValues: {
      label: '',
      clubId: '',
    },
    validate: {
      label: (v) => (v.trim() ? null : 'Label is required'),
      clubId: (v) => (v ? null : 'Club is required'),
    },
  });

  useEffect(() => {
    if (category) {
      form.setValues({
        label: category.label,
        clubId: category.clubId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSubmit = (values: typeof form.values) => {
    if (isEdit) {
      updateCategory.mutate(
        { id: id!, label: values.label },
        {
          onSuccess: () => {
            notifications.show({
              title: 'Category updated',
              message: `"${values.label}" has been updated.`,
              color: 'green',
            });
            navigate('/admin/team-categories');
          },
        },
      );
    } else {
      createCategory.mutate(
        { clubId: values.clubId, label: values.label },
        {
          onSuccess: () => {
            notifications.show({
              title: 'Category created',
              message: `"${values.label}" has been created.`,
              color: 'green',
            });
            navigate('/admin/team-categories');
          },
        },
      );
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <>
      <PageTitle label={isEdit ? 'Edit team category' : 'New team category'} />

      <FormWrapper>
        <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Club"
                placeholder="Select a club"
                data={clubOptions}
                required
                disabled={isEdit}
                description={
                  isEdit ? "Can't be changed after creation" : undefined
                }
                {...form.getInputProps('clubId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Label"
                placeholder="Category label"
                required
                {...form.getInputProps('label')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group>
                <Button
                  type="submit"
                  loading={createCategory.isPending || updateCategory.isPending}
                >
                  {isEdit ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => navigate('/admin/team-categories')}
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
