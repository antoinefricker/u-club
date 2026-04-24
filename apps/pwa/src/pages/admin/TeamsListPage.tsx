import { ActionIcon, Alert, Button, Group, Loader, Select, Table } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { PageTitle } from '../../components/layout/PageTitle';
import { ListFilters } from '../../components/admin/lists/ListFilters';
import { ListPagination } from '../../components/admin/lists/ListPagination';
import { EmptyListRow } from '../../components/admin/lists/EmptyListRow';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useTeams, useDeleteTeam } from '../../hooks/useTeams';
import { TEAM_GENDER_LABELS, TEAM_GENDER_OPTIONS, type TeamGender } from '../../types/Team';
import { useClubs } from '../../hooks/useClubs';
import { useTeamCategories } from '../../hooks/useTeamCategories';
import { usePagination } from '../../hooks/usePagination';
import { useListFilters } from '../../hooks/useListFilters';

const TEAMS_FILTER_KEYS = ['clubId', 'categoryId', 'gender'] as const;

export function TeamsListPage() {
    const navigate = useNavigate();
    const { page, itemsPerPage } = usePagination();
    const { filters, setFilter, setFilters } = useListFilters(TEAMS_FILTER_KEYS);
    const clubId = filters.clubId ?? null;
    const categoryId = filters.categoryId ?? null;
    const gender = (filters.gender as TeamGender | undefined) ?? null;

    const { data: clubsData } = useClubs({ itemsPerPage: 100 });
    const { data: categoriesData } = useTeamCategories({
        clubId: clubId ?? undefined,
        itemsPerPage: 100,
    });
    const {
        data: teamsData,
        isLoading,
        error,
    } = useTeams({
        page,
        itemsPerPage,
        clubId: clubId ?? undefined,
        categoryId: categoryId ?? undefined,
        gender: gender ?? undefined,
    });
    const deleteTeam = useDeleteTeam();

    const clubs = clubsData?.data;
    const categories = categoriesData?.data;
    const teams = teamsData?.data;
    const pagination = teamsData?.pagination;

    const clubOptions = clubs?.map((c) => ({ value: c.id, label: c.name })) ?? [];
    const clubNameById = new Map(clubs?.map((c) => [c.id, c.name]));
    const categoryOptions =
        categories?.map((c) => ({
            value: c.id,
            label: clubId ? c.label : `${clubNameById.get(c.clubId) ?? c.clubId} — ${c.label}`,
        })) ?? [];

    const handleClubChange = (v: string | null) => {
        setFilters({
            clubId: v ?? undefined,
            categoryId: undefined,
            gender: gender ?? undefined,
        });
    };

    const handleDelete = (id: string, label: string) => {
        if (!window.confirm(`Delete team "${label}"?`)) return;
        deleteTeam.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Team deleted',
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
            <PageTitle label="Teams">
                <Button onClick={() => navigate('/admin/teams/new')}>New team</Button>
            </PageTitle>

            <ListFilters>
                <Select
                    label="Filter by club"
                    placeholder="All clubs"
                    data={clubOptions}
                    value={clubId}
                    onChange={handleClubChange}
                    clearable
                    maw={300}
                />
                <Select
                    label="Filter by category"
                    placeholder="All categories"
                    data={categoryOptions}
                    value={categoryId}
                    onChange={(v) => setFilter('categoryId', v)}
                    clearable
                    searchable
                    maw={300}
                />
                <Select
                    label="Filter by gender"
                    placeholder="All genders"
                    data={TEAM_GENDER_OPTIONS}
                    value={gender}
                    onChange={(v) => setFilter('gender', v)}
                    clearable
                    maw={220}
                />
            </ListFilters>

            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Label</Table.Th>
                        <Table.Th>Club</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Gender</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {teams?.length === 0 && <EmptyListRow colSpan={5} />}
                    {teams?.map((team) => (
                        <Table.Tr key={team.id}>
                            <Table.Td>{team.label}</Table.Td>
                            <Table.Td>{clubNameById.get(team.clubId) ?? team.clubId}</Table.Td>
                            <Table.Td>{team.categoryLabel ?? '—'}</Table.Td>
                            <Table.Td>{TEAM_GENDER_LABELS[team.gender]}</Table.Td>
                            <Table.Td>
                                <Group gap="xs" justify="flex-end">
                                    <ActionIcon variant="subtle" onClick={() => navigate(`/admin/teams/${team.id}`)}>
                                        <IconEdit size={18} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleDelete(team.id, team.label)}
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
                    itemsLabel="teams"
                />
            )}
        </>
    );
}
