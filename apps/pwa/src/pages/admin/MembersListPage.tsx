import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Table,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { PageTitle } from '../../layout/PageTitle';
import { ListFilters } from '../../layout/ListFilters';
import { ListPagination } from '../../layout/ListPagination';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useMembers, useDeleteMember } from '../../hooks/useMembers';
import { useTeams } from '../../hooks/useTeams';
import { usePagination } from '../../hooks/usePagination';
import { useListFilters } from '../../hooks/useListFilters';

const MEMBERS_FILTER_KEYS = ['teamId'] as const;

export function MembersListPage() {
  const navigate = useNavigate();
  const { page, itemsPerPage } = usePagination();
  const { filters, setFilter } = useListFilters(MEMBERS_FILTER_KEYS);
  const teamId = filters.teamId ?? null;

  const { data: teamsData } = useTeams({ itemsPerPage: 100 });
  const {
    data: membersData,
    isLoading,
    error,
  } = useMembers({
    page,
    itemsPerPage,
    teamId: teamId ?? undefined,
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
            <Table.Th>First name</Table.Th>
            <Table.Th>Last name</Table.Th>
            <Table.Th w={120}>Birthdate</Table.Th>
            <Table.Th w={100}>Gender</Table.Th>
            <Table.Th w={90} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members?.map((member) => (
            <Table.Tr key={member.id}>
              <Table.Td>{member.firstName}</Table.Td>
              <Table.Td>{member.lastName}</Table.Td>
              <Table.Td>
                {member.birthdate
                  ? dayjs(member.birthdate).format('DD/MM/YYYY')
                  : '—'}
              </Table.Td>
              <Table.Td>{member.gender}</Table.Td>
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
