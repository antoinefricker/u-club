import { useState } from 'react';
import {
  Alert,
  Badge,
  Loader,
  Select,
  Table,
  TextInput,
  ActionIcon,
  Group,
} from '@mantine/core';
import { IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useUserMembers,
  useUpdateUserMember,
  useDeleteUserMember,
} from '../hooks/useUserMembers';

interface EditingState {
  id: string;
  type: string;
  description: string;
}

export function UserRelationships() {
  const { data: relationships, isLoading, error } = useUserMembers();
  const updateMutation = useUpdateUserMember();
  const deleteMutation = useDeleteUserMember();
  const [editing, setEditing] = useState<EditingState | null>(null);

  const handleEdit = (rel: {
    id: string;
    type: string;
    description: string | null;
  }) => {
    setEditing({
      id: rel.id,
      type: rel.type,
      description: rel.description ?? '',
    });
  };

  const handleSave = () => {
    if (!editing) return;
    updateMutation.mutate(
      {
        id: editing.id,
        type: editing.type,
        description: editing.description || null,
      },
      {
        onSuccess: () => {
          setEditing(null);
          notifications.show({
            title: 'Updated',
            message: 'Relationship updated.',
            color: 'green',
          });
        },
      },
    );
  };

  const handleCancel = () => setEditing(null);

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this relationship?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        notifications.show({
          title: 'Removed',
          message: 'Relationship removed.',
          color: 'green',
        });
      },
    });
  };

  if (isLoading) return <Loader size="sm" />;
  if (error)
    return (
      <Alert color="red" variant="light">
        Failed to load relationships
      </Alert>
    );
  if (!relationships?.length)
    return (
      <Alert color="grey" variant="light">
        No linked members yet.
      </Alert>
    );

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Member</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {relationships.map((rel) => (
          <Table.Tr key={rel.id}>
            <Table.Td>
              {rel.memberFirstName} {rel.memberLastName}
            </Table.Td>
            <Table.Td>
              {editing?.id === rel.id ? (
                <Select
                  size="xs"
                  data={[
                    { value: 'self', label: 'Self' },
                    { value: 'relative', label: 'Relative' },
                  ]}
                  value={editing.type}
                  onChange={(v) => v && setEditing({ ...editing, type: v })}
                />
              ) : (
                <Badge
                  variant="light"
                  color={rel.type === 'self' ? 'blue' : 'grape'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(rel)}
                >
                  {rel.type}
                </Badge>
              )}
            </Table.Td>
            <Table.Td>
              {editing?.id === rel.id ? (
                <TextInput
                  size="xs"
                  placeholder="e.g. father, mother"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              ) : (
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(rel)}
                >
                  {rel.description || '—'}
                </span>
              )}
            </Table.Td>
            <Table.Td>
              {editing?.id === rel.id ? (
                <Group gap="xs">
                  <ActionIcon
                    color="green"
                    variant="light"
                    size="sm"
                    onClick={handleSave}
                    loading={updateMutation.isPending}
                  >
                    <IconCheck size={14} />
                  </ActionIcon>
                  <ActionIcon
                    color="gray"
                    variant="light"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
              ) : (
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  onClick={() => handleDelete(rel.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
