import { ActionIcon, Alert, Button, Group, Loader, Table } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { PageTitle } from '../../layout/PageTitle';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { useClubs, useDeleteClub } from '../../hooks/useClubs';

export function ClubsListPage() {
  const navigate = useNavigate();
  const { data: clubs, isLoading, error } = useClubs();
  const deleteClub = useDeleteClub();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete club "${name}"?`)) return;
    deleteClub.mutate(id, {
      onSuccess: () => {
        notifications.show({
          title: 'Club deleted',
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
      <PageTitle label="Clubs">
        <Button onClick={() => navigate('/admin/clubs/new')}>New club</Button>
      </PageTitle>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Code</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {clubs?.map((club) => (
            <Table.Tr key={club.id}>
              <Table.Td>{club.name}</Table.Td>
              <Table.Td>{club.code}</Table.Td>
              <Table.Td>{club.description}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon
                    variant="subtle"
                    onClick={() => navigate(`/admin/clubs/${club.id}`)}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(club.id, club.name)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
