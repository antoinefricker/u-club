import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  Select,
  Table,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { PageTitle } from '../../components/layout/PageTitle';
import { ListFilters } from '../../components/admin/lists/ListFilters';
import { ListPagination } from '../../components/admin/lists/ListPagination';
import { EmptyListRow } from '../../components/admin/lists/EmptyListRow';
import { Link, useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useMembers, useDeleteMember } from '../../hooks/useMembers';
import { useTeams } from '../../hooks/useTeams';
import { MEMBER_GENDER_LABELS } from '../../types/Member';
import { usePagination } from '../../hooks/usePagination';
import { useListFilters } from '../../hooks/useListFilters';

const MEMBERS_FILTER_KEYS = ['teamId', 'search'] as const;

export function MembersListPage() {
  const navigate = useNavigate();
  const { page, itemsPerPage } = usePagination();
  const { filters, setFilter } = useListFilters(MEMBERS_FILTER_KEYS);
  const teamId = filters.teamId ?? null;
  const search = filters.search ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    if (search !== searchInput) setSearchInput(search);
  }

  const [debouncedSearch] = useDebouncedValue(searchInput, 300);
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === searchRef.current) return;
    setFilter('search', trimmed || null);
  }, [debouncedSearch, setFilter]);

  const { data: teamsData } = useTeams({ itemsPerPage: 100 });
  const {
    data: membersData,
    isLoading,
    error,
  } = useMembers({
    page,
    itemsPerPage,
    teamId: teamId ?? undefined,
    search: search || undefined,
  });
  const deleteMember = useDeleteMember();

  const teams = teamsData?.data;
  const members = membersData?.data;
  const pagination = membersData?.pagination;

  const teamOptions =
    teams?.map((t) => ({ value: t.id, label: t.label })) ?? [];

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete member "${name}"?`)) return;
    deleteMember.mutate(id, {
      onSuccess: () => {
        notifications.show({
          title: 'Member deleted',
          message: `"${name}" has been deleted.`,
          color: 'green',
        });
      },
    });
  };

  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">{String(error)}</Alert>;

  return (
    <>
      <PageTitle label="Members">
        <Button onClick={() => navigate('/admin/members/new')}>
          New member
        </Button>
      </PageTitle>

      <ListFilters>
        <TextInput
          label="Search"
          placeholder="Name or birthdate (DD/MM/YYYY)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchInput ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
              >
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
          w={300}
        />
        <Select
          label="Filter by team"
          placeholder="All teams"
          data={teamOptions}
          value={teamId}
          onChange={(v) => setFilter('teamId', v)}
          clearable
          maw={300}
        />
      </ListFilters>

      <Table striped highlightOnHover layout="fixed">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th w={120}>Birthdate</Table.Th>
            <Table.Th w={100}>Gender</Table.Th>
            <Table.Th w={100}>Status</Table.Th>
            <Table.Th w={90} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members?.length === 0 && <EmptyListRow colSpan={5} />}
          {members?.map((member) => (
            <Table.Tr key={member.id}>
              <Table.Td>
                <Anchor
                  component={Link}
                  to={`/admin/members/${member.id}`}
                  c="inherit"
                  underline="hover"
                >
                  {member.firstName} {member.lastName}
                </Anchor>
              </Table.Td>
              <Table.Td>
                {member.birthdate
                  ? dayjs(member.birthdate).format('DD/MM/YYYY')
                  : '—'}
              </Table.Td>
              <Table.Td>{MEMBER_GENDER_LABELS[member.gender]}</Table.Td>
              <Table.Td>{member.statusLabel ?? ''}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon
                    variant="subtle"
                    onClick={() => navigate(`/admin/members/${member.id}`)}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() =>
                      handleDelete(
                        member.id,
                        `${member.firstName} ${member.lastName}`,
                      )
                    }
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
          itemsLabel="members"
        />
      )}
    </>
  );
}
