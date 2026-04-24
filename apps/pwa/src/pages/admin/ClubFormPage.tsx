import { useEffect } from 'react';
import { Button, Grid, Group, Loader, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import { useClub, useCreateClub, useUpdateClub } from '../../hooks/useClubs';

export function ClubFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: club, isLoading } = useClub(id ?? '');
    const createClub = useCreateClub();
    const updateClub = useUpdateClub();

    const form = useForm({
        initialValues: {
            name: '',
            code: '',
            description: '',
        },
        validate: {
            name: (v) => (v.trim() ? null : 'Name is required'),
            code: (v) => (v.trim() ? null : 'Code is required'),
        },
    });

    useEffect(() => {
        if (club) {
            form.setValues({
                name: club.name,
                code: club.code,
                description: club.description ?? '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [club]);

    const handleSubmit = (values: typeof form.values) => {
        const payload = {
            ...values,
            description: values.description || null,
        };

        if (isEdit) {
            updateClub.mutate(
                { id: id!, ...payload },
                {
                    onSuccess: () => {
                        notifications.show({
                            title: 'Club updated',
                            message: `"${values.name}" has been updated.`,
                            color: 'green',
                        });
                        navigate('/admin/clubs');
                    },
                },
            );
        } else {
            createClub.mutate(payload, {
                onSuccess: () => {
                    notifications.show({
                        title: 'Club created',
                        message: `"${values.name}" has been created.`,
                        color: 'green',
                    });
                    navigate('/admin/clubs');
                },
            });
        }
    };

    if (isEdit && isLoading) return <Loader />;

    return (
        <>
            <PageTitle label={isEdit ? 'Edit club' : 'New club'} />
            <FormWrapper>
                <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <TextInput label="Name" placeholder="Club name" required {...form.getInputProps('name')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <TextInput label="Code" placeholder="Club code" required {...form.getInputProps('code')} />
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
                                <Button type="submit" loading={createClub.isPending || updateClub.isPending}>
                                    {isEdit ? 'Update' : 'Create'}
                                </Button>
                                <Button variant="subtle" onClick={() => navigate('/admin/clubs')}>
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
