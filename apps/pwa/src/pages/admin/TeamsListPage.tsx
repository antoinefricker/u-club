import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Title,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useTeams, useDeleteTeam } from '../../hooks/useTeams';
import { useClubs } from '../../hooks/useClubs';

export function TeamsListPage() {
  const navigate = useNavigate();
  const [clubId, setClubId] = useState<string | null>(null);
  const { data: clubs } = useClubs();
  const { data: teams, isLoading, error } = useTeams(clubId ?? undefined);
  const deleteTeam = useDeleteTeam();

  const clubOptions = clubs?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const clubNameById = new Map(clubs?.map((c) => [c.id, c.name]));

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
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Teams</Title>
        <Button onClick={() => navigate('/admin/teams/new')}>New team</Button>
      </Group>

      <Select
        label="Filter by club"
        placeholder="All clubs"
        data={clubOptions}
        value={clubId}
        onChange={setClubId}
        clearable
        maw={300}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Label</Table.Th>
            <Table.Th>Club</Table.Th>
            <Table.Th>Year</Table.Th>
            <Table.Th>Gender</Table.Th>
            <Table.Th>Archived</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {teams?.map((team) => (
            <Table.Tr key={team.id}>
              <Table.Td>{team.label}</Table.Td>
              <Table.Td>
                {clubNameById.get(team.clubId) ?? team.clubId}
              </Table.Td>
              <Table.Td>{team.year}</Table.Td>
              <Table.Td>{team.gender}</Table.Td>
              <Table.Td>
                {team.archived && (
                  <Badge color="gray" variant="light">
                    Archived
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon
                    variant="subtle"
                    onClick={() => navigate(`/admin/teams/${team.id}`)}
                  >
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
    </Stack>
  );
}
