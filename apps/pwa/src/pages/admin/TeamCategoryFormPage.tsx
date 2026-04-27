import { useEffect } from 'react';
import { Button, Grid, Loader, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { AdminSection } from '../../components/admin/AdminSection';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import { useTeamCategory, useCreateTeamCategory, useUpdateTeamCategory } from '../../hooks/useTeamCategories';
import { useClubs } from '../../hooks/useClubs';
import { InputHelper } from '../../components/admin/forms/InputHelper';

export function TeamCategoryFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: category, isLoading } = useTeamCategory(id ?? '');
    const { data: clubsData } = useClubs({ itemsPerPage: 100 });
    const createCategory = useCreateTeamCategory();
    const updateCategory = useUpdateTeamCategory();

    const clubOptions = clubsData?.data.map((c) => ({ value: c.id, label: c.name })) ?? [];

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
                    <AdminSection
                        title="Category details"
                        actionButtons={[
                            <Button
                                key="cancel"
                                variant="subtle"
                                color="white"
                                onClick={() => navigate('/admin/team-categories')}
                            >
                                Cancel
                            </Button>,
                            <Button
                                key="submit"
                                type="submit"
                                loading={createCategory.isPending || updateCategory.isPending}
                            >
                                {isEdit ? 'Save' : 'Create'}
                            </Button>,
                        ]}
                    >
                        <Grid gutter="md">
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Select
                                    label="Club"
                                    placeholder="Select a club"
                                    data={clubOptions}
                                    required
                                    disabled={isEdit}
                                    {...form.getInputProps('clubId')}
                                />
                                {isEdit && <InputHelper>Can&apos;t be changed after creation</InputHelper>}
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput
                                    label="Label"
                                    placeholder="Category label"
                                    required
                                    {...form.getInputProps('label')}
                                />
                            </Grid.Col>
                        </Grid>
                    </AdminSection>
                </form>
            </FormWrapper>
        </>
    );
}
