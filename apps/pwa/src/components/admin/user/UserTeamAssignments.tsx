import { useState } from 'react';
import { ActionIcon, Alert, Group, Loader, Select, Table, Text, Tooltip, useMantineTheme } from '@mantine/core';
import { IconCheck, IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    useTeamAssignments,
    useUpdateTeamAssignment,
    useDeleteTeamAssignment,
} from '../../../hooks/useTeamAssignments';
import { useTeams } from '../../../hooks/useTeams';
import { TEAM_ROLE_LABELS, TEAM_ROLE_OPTIONS, type TeamRole } from '../../../types/TeamAssignment';
import { TEAM_GENDER_LABELS } from '../../../types/Team';

interface UserTeamAssignmentsProps {
    userId?: string;
    memberId?: string;
    editable?: boolean;
}

export function UserTeamAssignments({ userId, memberId, editable = false }: UserTeamAssignmentsProps = {}) {
    const theme = useMantineTheme();
    const { data, isLoading, error } = useTeamAssignments({
        itemsPerPage: 100,
        userId,
        memberId,
    });
    const assignments = data?.data;
    const { data: teamsData } = useTeams({ itemsPerPage: 100 });
    const updateMutation = useUpdateTeamAssignment();
    const deleteMutation = useDeleteTeamAssignment();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedTeamId, setEditedTeamId] = useState<string | null>(null);
    const [editedRole, setEditedRole] = useState<TeamRole | null>(null);

    const teamOptions =
        teamsData?.data.map((t) => ({
            value: t.id,
            label: t.categoryLabel ? `${t.label} · ${t.categoryLabel}` : t.label,
        })) ?? [];

    const startEdit = (id: string, currentTeamId: string, currentRole: TeamRole) => {
        if (editingId && editingId !== id) {
            notifications.show({
                title: 'Another row is being edited',
                message: 'Save or cancel the current edit before editing another row.',
                color: 'orange',
            });
            return;
        }
        setEditingId(id);
        setEditedTeamId(currentTeamId);
        setEditedRole(currentRole);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditedTeamId(null);
        setEditedRole(null);
    };

    const saveEdit = (id: string, currentTeamId: string, currentRole: TeamRole) => {
        if (!editedTeamId || !editedRole) return;
        const changes: { teamId?: string; role?: TeamRole } = {};
        if (editedTeamId !== currentTeamId) changes.teamId = editedTeamId;
        if (editedRole !== currentRole) changes.role = editedRole;
        if (!changes.teamId && !changes.role) return;
        updateMutation.mutate(
            { id, ...changes },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditedTeamId(null);
                    setEditedRole(null);
                    notifications.show({
                        title: 'Updated',
                        message: 'Assignment updated.',
                        color: 'green',
                    });
                },
                onError: (err: Error) => {
                    notifications.show({
                        title: 'Update failed',
                        message: err.message,
                        color: 'red',
                    });
                },
            },
        );
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Remove this team assignment?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Removed',
                    message: 'Team assignment removed.',
                    color: 'green',
                });
            },
        });
    };

    if (isLoading) return <Loader size="sm" />;
    if (error)
        return (
            <Alert color="red" variant="light">
                Failed to load team assignments
            </Alert>
        );
    if (!assignments?.length)
        return (
            <Alert color="blue" variant="light">
                {memberId ? 'No teams for this member.' : 'No team assignments yet.'}
            </Alert>
        );

    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th w={24}>#</Table.Th>
                    <Table.Th w={220}>Member</Table.Th>
                    <Table.Th>Team</Table.Th>
                    <Table.Th w={editable ? 200 : 140}>Role</Table.Th>
                    {editable && <Table.Th w={80} />}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {assignments.map((assignment, index) => {
                    const isEditing = editingId === assignment.id;
                    const dirty =
                        isEditing &&
                        editedTeamId !== null &&
                        editedRole !== null &&
                        (editedTeamId !== assignment.teamId || editedRole !== assignment.role);
                    const subtitle = [assignment.teamCategoryLabel, TEAM_GENDER_LABELS[assignment.teamGender]]
                        .filter(Boolean)
                        .join(' · ');

                    return (
                        <Table.Tr key={assignment.id} bg={isEditing ? theme.colors.gray[1] : undefined}>
                            <Table.Td>
                                <Text size="xs" c="dimmed">
                                    {index + 1}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">
                                    {assignment.memberFirstName} {assignment.memberLastName}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                {isEditing ? (
                                    <Select
                                        data={teamOptions}
                                        value={editedTeamId}
                                        onChange={setEditedTeamId}
                                        searchable
                                        size="sm"
                                    />
                                ) : (
                                    <>
                                        <Text component="span" size="sm">
                                            {assignment.teamLabel}
                                        </Text>
                                        {subtitle && (
                                            <Text component="span" size="xs" c="dimmed">
                                                &nbsp;/&nbsp;{subtitle}
                                            </Text>
                                        )}
                                    </>
                                )}
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
                            {editable && (
                                <Table.Td>
                                    <Group justify="flex-end" gap="xs">
                                        {isEditing ? (
                                            <>
                                                <Tooltip label="Cancel" position="left" offset={1}>
                                                    <ActionIcon
                                                        color="primary"
                                                        variant="subtle"
                                                        size="sm"
                                                        aria-label="Cancel edit"
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
                                                        aria-label="Save assignment"
                                                        onClick={() =>
                                                            saveEdit(assignment.id, assignment.teamId, assignment.role)
                                                        }
                                                        loading={updateMutation.isPending}
                                                        disabled={!dirty}
                                                    >
                                                        <IconCheck />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <>
                                                <Tooltip label="Edit assignment" position="left" offset={1}>
                                                    <ActionIcon
                                                        color="primary"
                                                        variant="subtle"
                                                        size="sm"
                                                        aria-label="Edit assignment"
                                                        onClick={() =>
                                                            startEdit(assignment.id, assignment.teamId, assignment.role)
                                                        }
                                                    >
                                                        <IconEdit />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Remove assignment" position="left" offset={1}>
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="sm"
                                                        aria-label="Remove assignment"
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
                            )}
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}
