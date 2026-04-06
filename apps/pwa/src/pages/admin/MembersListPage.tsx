import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Title,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useMembers, useDeleteMember } from '../../hooks/useMembers';
import { useTeams } from '../../hooks/useTeams';

export function MembersListPage() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState<string | null>(null);
  const { data: teams } = useTeams();
  const { data: members, isLoading, error } = useMembers(teamId ?? undefined);
  const deleteMember = useDeleteMember();

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
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Members</Title>
        <Button onClick={() => navigate('/admin/members/new')}>
          New member
        </Button>
      </Group>

      <Select
        label="Filter by team"
        placeholder="All teams"
        data={teamOptions}
        value={teamId}
        onChange={setTeamId}
        clearable
        maw={300}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>First name</Table.Th>
            <Table.Th>Last name</Table.Th>
            <Table.Th>Gender</Table.Th>
            <Table.Th>Year</Table.Th>
            <Table.Th>License</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members?.map((member) => (
            <Table.Tr key={member.id}>
              <Table.Td>{member.firstName}</Table.Td>
              <Table.Td>{member.lastName}</Table.Td>
              <Table.Td>{member.gender}</Table.Td>
              <Table.Td>{member.year}</Table.Td>
              <Table.Td>{member.license}</Table.Td>
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
    </Stack>
  );
}
