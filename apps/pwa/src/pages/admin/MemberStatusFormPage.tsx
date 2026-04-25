import { useEffect } from 'react';
import { Button, Grid, Group, Loader, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate, useParams } from 'react-router';
import { FormWrapper } from '../../components/admin/forms/FormWrapper';
import { PageTitle } from '../../components/layout/PageTitle';
import { useMemberStatus, useCreateMemberStatus, useUpdateMemberStatus } from '../../hooks/useMemberStatuses';

export function MemberStatusFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();

    const { data: status, isLoading } = useMemberStatus(id ?? '');
    const createStatus = useCreateMemberStatus();
    const updateStatus = useUpdateMemberStatus();

    const form = useForm({
        initialValues: {
            label: '',
        },
        validate: {
            label: (v) => (v.trim() ? null : 'Label is required'),
        },
    });

    useEffect(() => {
        if (status) {
            form.setValues({ label: status.label });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handleError = (err: Error) => {
        notifications.show({
            title: isEdit ? 'Failed to update status' : 'Failed to create status',
            message: err.message,
            color: 'red',
        });
    };

    const handleSubmit = (values: typeof form.values) => {
        if (isEdit) {
            updateStatus.mutate(
                { id: id!, label: values.label },
                {
                    onSuccess: () => {
                        notifications.show({
                            title: 'Status updated',
                            message: `"${values.label}" has been updated.`,
                            color: 'green',
                        });
                        navigate('/admin/member-statuses');
                    },
                    onError: handleError,
                },
            );
        } else {
            createStatus.mutate(
                { label: values.label },
                {
                    onSuccess: () => {
                        notifications.show({
                            title: 'Status created',
                            message: `"${values.label}" has been created.`,
                            color: 'green',
                        });
                        navigate('/admin/member-statuses');
                    },
                    onError: handleError,
                },
            );
        }
    };

    if (isEdit && isLoading) return <Loader />;

    return (
        <>
            <PageTitle label={isEdit ? 'Edit member status' : 'New member status'} />

            <FormWrapper>
                <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <TextInput
                                label="Label"
                                placeholder="Status label"
                                required
                                {...form.getInputProps('label')}
                            />
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Group style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="subtle" onClick={() => navigate('/admin/member-statuses')}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={createStatus.isPending || updateStatus.isPending}>
                                    {isEdit ? 'Save' : 'Create'}
                                </Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </form>
            </FormWrapper>
        </>
    );
}
