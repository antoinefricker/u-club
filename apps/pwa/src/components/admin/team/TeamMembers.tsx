import { useState } from 'react';
import { ActionIcon, Alert, Anchor, Group, Loader, Select, Table, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconCheck, IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router';
import {
    useTeamAssignments,
    useUpdateTeamAssignment,
    useDeleteTeamAssignment,
} from '../../../hooks/useTeamAssignments';
import { TEAM_ROLE_LABELS, TEAM_ROLE_OPTIONS, type TeamRole } from '../../../types/TeamAssignment';

interface TeamMembersProps {
    teamId: string;
}

export function TeamMembers({ teamId }: TeamMembersProps) {
    const theme = useMantineTheme();
    const { data, isLoading, error } = useTeamAssignments({ teamId, itemsPerPage: 100 });
    const assignments = data?.data;
    const updateMutation = useUpdateTeamAssignment();
    const deleteMutation = useDeleteTeamAssignment();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedRole, setEditedRole] = useState<TeamRole | null>(null);

    const startEdit = (id: string, currentRole: TeamRole) => {
        if (editingId && editingId !== id) {
            notifications.show({
                title: 'Another row is being edited',
                message: 'Save or cancel the current edit before editing another row.',
                color: 'orange',
            });
            return;
        }
        setEditingId(id);
        setEditedRole(currentRole);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditedRole(null);
    };

    const saveEdit = (id: string) => {
        if (!editedRole) return;
        updateMutation.mutate(
            { id, role: editedRole },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditedRole(null);
                    notifications.show({
                        title: 'Updated',
                        message: 'Role updated.',
                        color: 'green',
                    });
                },
            },
        );
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Remove this member from the team?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Removed',
                    message: 'Member removed from the team.',
                    color: 'green',
                });
            },
        });
    };

    if (isLoading) return <Loader size="sm" />;
    if (error)
        return (
            <Alert color="red" variant="light">
                Failed to load team members
            </Alert>
        );
    if (!assignments?.length)
        return (
            <Alert color="blue" variant="light">
                No members assigned yet.
            </Alert>
        );

    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th w={24}>#</Table.Th>
                    <Table.Th>Member</Table.Th>
                    <Table.Th w={180}>Role</Table.Th>
                    <Table.Th w={110} />
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {assignments.map((assignment, index) => {
                    const isEditing = editingId === assignment.id;
                    const dirty = isEditing && editedRole !== null && editedRole !== assignment.role;
                    const memberName = `${assignment.memberFirstName} ${assignment.memberLastName}`;

                    return (
                        <Table.Tr key={assignment.id} bg={isEditing ? theme.colors.gray[1] : undefined}>
                            <Table.Td>
                                <Text size="xs" c="dimmed">
                                    {index + 1}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Anchor
                                    component={Link}
                                    to={`/admin/members/${assignment.memberId}`}
                                    c="inherit"
                                    underline="hover"
                                    size="sm"
                                >
                                    {memberName}
                                </Anchor>
                            </Table.Td>
                            <Table.Td>
                                {isEditing ? (
                                    <Select
                                        data={TEAM_ROLE_OPTIONS}
                                        value={editedRole}
                                        onChange={(v) => setEditedRole(v as TeamRole | null)}
                                        size="sm"
                                    />
                                ) : (
                                    <Text size="sm">{TEAM_ROLE_LABELS[assignment.role]}</Text>
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Group justify="flex-end" gap="xs">
                                    {isEditing ? (
                                        <>
                                            <Tooltip label="Cancel" position="left" offset={1}>
                                                <ActionIcon
                                                    color="primary"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Cancel edit for ${memberName}`}
                                                    onClick={cancelEdit}
                                                >
                                                    <IconX />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Save" position="left" offset={1}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Save role for ${memberName}`}
                                                    onClick={() => saveEdit(assignment.id)}
                                                    loading={updateMutation.isPending}
                                                    disabled={!dirty}
                                                >
                                                    <IconCheck />
                                                </ActionIcon>
                                            </Tooltip>
                                        </>
                                    ) : (
                                        <>
                                            <Tooltip label={`Edit role for ${memberName}`} position="left" offset={1}>
                                                <ActionIcon
                                                    color="primary"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Edit role for ${memberName}`}
                                                    onClick={() => startEdit(assignment.id, assignment.role)}
                                                >
                                                    <IconEdit />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip
                                                label={`Remove ${memberName} from the team`}
                                                position="left"
                                                offset={1}
                                            >
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Remove ${memberName} from the team`}
                                                    onClick={() => handleDelete(assignment.id)}
                                                    loading={deleteMutation.isPending}
                                                >
                                                    <IconTrash />
                                                </ActionIcon>
                                            </Tooltip>
                                        </>
                                    )}
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}
