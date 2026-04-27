import { useEffect } from 'react';
import { Button, Grid, Loader, Select, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { AdminSection } from '../../components/admin/AdminSection';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import { useTeam, useCreateTeam, useUpdateTeam } from '../../hooks/useTeams';
import { TEAM_GENDER_OPTIONS, type TeamGender } from '../../types/Team';
import { useClubs } from '../../hooks/useClubs';
import { useTeamCategories } from '../../hooks/useTeamCategories';
import { TeamMembers } from '../../components/admin/team/TeamMembers';
import { AddTeamMemberButton } from '../../components/admin/team/AddTeamMemberButton';

export function TeamFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: team, isLoading } = useTeam(id ?? '');
    const { data: clubs } = useClubs({ itemsPerPage: 100 });
    const createTeam = useCreateTeam();
    const updateTeam = useUpdateTeam();

    const clubOptions = clubs?.data.map((c) => ({ value: c.id, label: c.name })) ?? [];

    const form = useForm<{
        label: string;
        clubId: string;
        gender: TeamGender | '';
        description: string;
        categoryId: string;
    }>({
        initialValues: {
            label: '',
            clubId: '',
            gender: '',
            description: '',
            categoryId: '',
        },
        validate: {
            label: (v) => (v.trim() ? null : 'Label is required'),
            clubId: (v) => (v ? null : 'Club is required'),
            gender: (v) => (v ? null : 'Gender is required'),
        },
    });

    const { data: categoriesData } = useTeamCategories({
        clubId: form.values.clubId || undefined,
        itemsPerPage: 100,
    });
    const categoryOptions = categoriesData?.data.map((c) => ({ value: c.id, label: c.label })) ?? [];

    useEffect(() => {
        if (team) {
            form.setValues({
                label: team.label,
                clubId: team.clubId,
                gender: team.gender,
                description: team.description ?? '',
                categoryId: team.categoryId ?? '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team]);

    const handleSubmit = (values: typeof form.values) => {
        const payload = {
            ...values,
            gender: values.gender as TeamGender,
            description: values.description || null,
            categoryId: values.categoryId || null,
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
                    <AdminSection
                        title="Team details"
                        actionButtons={[
                            <Button
                                key="cancel"
                                variant="subtle"
                                color="white"
                                onClick={() => navigate('/admin/teams')}
                            >
                                Cancel
                            </Button>,
                            <Button key="submit" type="submit" loading={createTeam.isPending || updateTeam.isPending}>
                                {isEdit ? 'Save' : 'Create'}
                            </Button>,
                        ]}
                    >
                        <Grid gap="md">
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
                                    onChange={(value) => {
                                        form.setFieldValue('clubId', value ?? '');
                                        form.setFieldValue('categoryId', '');
                                    }}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Select
                                    label="Category"
                                    placeholder={form.values.clubId ? 'No category' : 'Pick a club first'}
                                    data={categoryOptions}
                                    clearable
                                    disabled={!form.values.clubId}
                                    {...form.getInputProps('categoryId')}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Select
                                    label="Gender"
                                    placeholder="Select gender"
                                    data={TEAM_GENDER_OPTIONS}
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
                        </Grid>
                    </AdminSection>
                </form>
            </FormWrapper>
            {team?.id && (
                <FormWrapper>
                    <AdminSection
                        title="Team composition"
                        actionButtons={[<AddTeamMemberButton key="add-member" teamId={team.id} />]}
                    >
                        <TeamMembers teamId={team.id} />
                    </AdminSection>
                </FormWrapper>
            )}
        </>
    );
}
