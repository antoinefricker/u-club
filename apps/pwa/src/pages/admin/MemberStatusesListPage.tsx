import { ActionIcon, Alert, Anchor, Button, Group, Loader, Table } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { PageTitle } from '../../components/layout/PageTitle';
import { ListPagination } from '../../components/admin/lists/ListPagination';
import { EmptyListRow } from '../../components/admin/lists/EmptyListRow';
import { Link, useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useMemberStatuses, useDeleteMemberStatus } from '../../hooks/useMemberStatuses';
import { usePagination } from '../../hooks/usePagination';

export function MemberStatusesListPage() {
    const navigate = useNavigate();
    const { page, itemsPerPage } = usePagination();

    const { data: statusesData, isLoading, error } = useMemberStatuses({ page, itemsPerPage });
    const deleteStatus = useDeleteMemberStatus();

    const statuses = statusesData?.data;
    const pagination = statusesData?.pagination;

    const handleDelete = (id: string, label: string) => {
        if (!window.confirm(`Delete status "${label}"?`)) return;
        deleteStatus.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Status deleted',
                    message: `"${label}" has been deleted.`,
                    color: 'green',
                });
            },
        });
    };

    if (isLoading) return <Loader />;
    if (error) return <Alert color="red">{String(error)}</Alert>;

    return (
        <>
            <PageTitle label="Member statuses">
                <Button onClick={() => navigate('/admin/member-statuses/new')}>New status</Button>
            </PageTitle>

            <Table striped highlightOnHover layout="fixed">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Label</Table.Th>
                        <Table.Th w={90} />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {statuses?.length === 0 && <EmptyListRow colSpan={2} />}
                    {statuses?.map((status) => (
                        <Table.Tr key={status.id}>
                            <Table.Td>
                                <Anchor
                                    component={Link}
                                    to={`/admin/member-statuses/${status.id}`}
                                    c="inherit"
                                    underline="hover"
                                    size="sm"
                                >
                                    {status.label}
                                </Anchor>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs" justify="flex-end">
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => navigate(`/admin/member-statuses/${status.id}`)}
                                    >
                                        <IconEdit size={18} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleDelete(status.id, status.label)}
                                    >
                                        <IconTrash size={18} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            {pagination && (
                <ListPagination
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsLabel="statuses"
                />
            )}
        </>
    );
}
