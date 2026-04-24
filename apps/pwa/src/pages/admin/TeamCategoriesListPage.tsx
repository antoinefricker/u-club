import { ActionIcon, Alert, Button, Group, Loader, Select, Table } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { PageTitle } from '../../components/layout/PageTitle';
import { ListFilters } from '../../components/admin/lists/ListFilters';
import { ListPagination } from '../../components/admin/lists/ListPagination';
import { EmptyListRow } from '../../components/admin/lists/EmptyListRow';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useTeamCategories, useDeleteTeamCategory } from '../../hooks/useTeamCategories';
import { useClubs } from '../../hooks/useClubs';
import { usePagination } from '../../hooks/usePagination';
import { useListFilters } from '../../hooks/useListFilters';

const FILTER_KEYS = ['clubId'] as const;

export function TeamCategoriesListPage() {
    const navigate = useNavigate();
    const { page, itemsPerPage } = usePagination();
    const { filters, setFilter } = useListFilters(FILTER_KEYS);
    const clubId = filters.clubId ?? null;

    const { data: clubsData } = useClubs({ itemsPerPage: 100 });
    const {
        data: categoriesData,
        isLoading,
        error,
    } = useTeamCategories({
        page,
        itemsPerPage,
        clubId: clubId ?? undefined,
    });
    const deleteCategory = useDeleteTeamCategory();

    const clubs = clubsData?.data;
    const categories = categoriesData?.data;
    const pagination = categoriesData?.pagination;

    const clubOptions = clubs?.map((c) => ({ value: c.id, label: c.name })) ?? [];
    const clubNameById = new Map(clubs?.map((c) => [c.id, c.name]));

    const handleDelete = (id: string, label: string) => {
        if (!window.confirm(`Delete category "${label}"?`)) return;
        deleteCategory.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Category deleted',
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
            <PageTitle label="Team categories">
                <Button onClick={() => navigate('/admin/team-categories/new')}>New category</Button>
            </PageTitle>

            <ListFilters>
                <Select
                    label="Filter by club"
                    placeholder="All clubs"
                    data={clubOptions}
                    value={clubId}
                    onChange={(v) => setFilter('clubId', v)}
                    clearable
                    maw={300}
                />
            </ListFilters>

            <Table striped highlightOnHover layout="fixed">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Label</Table.Th>
                        <Table.Th>Club</Table.Th>
                        <Table.Th w={90} />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {categories?.length === 0 && <EmptyListRow colSpan={3} />}
                    {categories?.map((category) => (
                        <Table.Tr key={category.id}>
                            <Table.Td>{category.label}</Table.Td>
                            <Table.Td>{clubNameById.get(category.clubId) ?? category.clubId}</Table.Td>
                            <Table.Td>
                                <Group gap="xs" justify="flex-end">
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => navigate(`/admin/team-categories/${category.id}`)}
                                    >
                                        <IconEdit size={18} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleDelete(category.id, category.label)}
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
                    itemsLabel="categories"
                />
            )}
        </>
    );
}
