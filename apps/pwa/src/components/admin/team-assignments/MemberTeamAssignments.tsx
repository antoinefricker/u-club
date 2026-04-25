import { useState } from 'react';
import { ActionIcon, Alert, Button, Group, Loader, Select, Table, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTeams } from '../../../hooks/useTeams';
import {
    useMemberTeamAssignments,
    useCreateTeamAssignment,
    useUpdateTeamAssignment,
    useDeleteTeamAssignment,
} from '../../../hooks/useTeamAssignments';
import { TEAM_GENDER_LABELS } from '../../../types/Team';
import { TEAM_ROLE_LABELS, TEAM_ROLE_OPTIONS, type TeamRole } from '../../../types/MemberTeamAssignment';

interface MemberTeamAssignmentsProps {
    memberId: string;
}

export function MemberTeamAssignments({ memberId }: MemberTeamAssignmentsProps) {
    const { data: assignments, isLoading, error } = useMemberTeamAssignments(memberId);
    const { data: teamsData } = useTeams({ itemsPerPage: 100 });
    const createAssignment = useCreateTeamAssignment();
    const updateAssignment = useUpdateTeamAssignment();
    const deleteAssignment = useDeleteTeamAssignment();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<TeamRole>('player');
    const [isAdding, setIsAdding] = useState(false);
    const [addTeamId, setAddTeamId] = useState<string | null>(null);
    const [addRole, setAddRole] = useState<TeamRole>('player');

    const warnAlreadyOpen = () => {
        notifications.show({
            title: 'Another form is open',
            message: 'Save or cancel the current edit before opening another.',
            color: 'orange',
        });
    };

    const handleEdit = (assignment: { id: string; role: TeamRole }) => {
        if ((editingId && editingId !== assignment.id) || isAdding) {
            warnAlreadyOpen();
            return;
        }
        setEditingId(assignment.id);
        setEditRole(assignment.role);
    };

    const handleEditCancel = () => {
        setEditingId(null);
    };

    const handleEditSave = (assignment: { id: string; teamId: string; role: TeamRole }) => {
        updateAssignment.mutate(
            { teamId: assignment.teamId, memberId, role: editRole },
            {
                onSuccess: () => {
                    setEditingId(null);
                    notifications.show({
                        title: 'Assignment updated',
                        message: `Role changed to ${TEAM_ROLE_LABELS[editRole]}.`,
                        color: 'green',
                    });
                },
                onError: (err: Error) => {
                    notifications.show({
                        title: 'Failed to update assignment',
                        message: err.message,
                        color: 'red',
                    });
                },
            },
        );
    };

    const handleAddOpen = () => {
        if (editingId || isAdding) {
            warnAlreadyOpen();
            return;
        }
        setIsAdding(true);
        setAddTeamId(null);
        setAddRole('player');
    };

    const handleAddCancel = () => {
        setIsAdding(false);
        setAddTeamId(null);
    };

    const handleAddSave = () => {
        if (!addTeamId) return;
        createAssignment.mutate(
            { teamId: addTeamId, memberId, role: addRole },
            {
                onSuccess: () => {
                    setIsAdding(false);
                    setAddTeamId(null);
                    notifications.show({
                        title: 'Assignment added',
                        message: 'Team assignment created.',
                        color: 'green',
                    });
                },
                onError: (err: Error) => {
                    notifications.show({
                        title: 'Failed to add assignment',
                        message: err.message,
                        color: 'red',
                    });
                },
            },
        );
    };

    const handleDelete = (assignment: { teamId: string; teamLabel: string }) => {
        if (!window.confirm(`Remove this member from "${assignment.teamLabel}"?`)) return;
        deleteAssignment.mutate(
            { teamId: assignment.teamId, memberId },
            {
                onSuccess: () => {
                    notifications.show({
                        title: 'Assignment removed',
                        message: `Member removed from "${assignment.teamLabel}".`,
                        color: 'green',
                    });
                },
            },
        );
    };

    if (isLoading) return <Loader size="sm" />;
    if (error)
        return (
            <Alert color="red" variant="light">
                Failed to load team assignments
            </Alert>
        );

    const assignedTeamIds = new Set(assignments?.map((a) => a.teamId) ?? []);
    const availableTeamOptions =
        teamsData?.data
            .filter((t) => !assignedTeamIds.has(t.id))
            .map((t) => ({
                value: t.id,
                label: `${t.label}${t.categoryLabel ? ` — ${t.categoryLabel}` : ''} (${TEAM_GENDER_LABELS[t.gender]})`,
            })) ?? [];

    const showEmpty = !assignments?.length && !isAdding;

    return (
        <>
            {showEmpty && (
                <Alert color="blue" variant="light" mb="md">
                    No team assignments yet.
                </Alert>
            )}

            {!showEmpty && (
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={24}>#</Table.Th>
                            <Table.Th>Team</Table.Th>
                            <Table.Th w={200}>Role</Table.Th>
                            <Table.Th w={100} />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {assignments?.map((a, index) => {
                            const isEditing = editingId === a.id;
                            return (
                                <Table.Tr key={a.id}>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">
                                            {index + 1}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={700}>
                                            {a.teamLabel}
                                        </Text>
                                        <Text size="xs" c="dimmed" mt={-4}>
                                            {a.teamCategoryLabel ? `${a.teamCategoryLabel} — ` : ''}
                                            {TEAM_GENDER_LABELS[a.teamGender]}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {isEditing ? (
                                            <Select
                                                data={TEAM_ROLE_OPTIONS}
                                                value={editRole}
                                                onChange={(v) => v && setEditRole(v as TeamRole)}
                                                size="sm"
                                            />
                                        ) : (
                                            TEAM_ROLE_LABELS[a.role]
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap="xs">
                                            {isEditing ? (
                                                <>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={handleEditCancel}
                                                        aria-label="Cancel edit"
                                                    >
                                                        <IconX />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        color="green"
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEditSave({
                                                                id: a.id,
                                                                teamId: a.teamId,
                                                                role: a.role,
                                                            })
                                                        }
                                                        loading={updateAssignment.isPending}
                                                        disabled={editRole === a.role}
                                                        aria-label="Save edit"
                                                    >
                                                        <IconCheck />
                                                    </ActionIcon>
                                                </>
                                            ) : (
                                                <>
                                                    <Tooltip
                                                        label={`Edit role on "${a.teamLabel}"`}
                                                        position="left"
                                                        offset={1}
                                                    >
                                                        <ActionIcon
                                                            color="primary"
                                                            variant="subtle"
                                                            size="sm"
                                                            onClick={() => handleEdit(a)}
                                                            aria-label={`Edit role on ${a.teamLabel}`}
                                                        >
                                                            <IconEdit />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip
                                                        label={`Remove from "${a.teamLabel}"`}
                                                        position="left"
                                                        offset={1}
                                                    >
                                                        <ActionIcon
                                                            color="red"
                                                            variant="subtle"
                                                            size="sm"
                                                            onClick={() => handleDelete(a)}
                                                            loading={deleteAssignment.isPending}
                                                            aria-label={`Remove from ${a.teamLabel}`}
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
                        {isAdding && (
                            <Table.Tr>
                                <Table.Td />
                                <Table.Td>
                                    <Select
                                        data={availableTeamOptions}
                                        value={addTeamId}
                                        onChange={setAddTeamId}
                                        placeholder="Select a team"
                                        searchable
                                        size="sm"
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Select
                                        data={TEAM_ROLE_OPTIONS}
                                        value={addRole}
                                        onChange={(v) => v && setAddRole(v as TeamRole)}
                                        size="sm"
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Group justify="flex-end" gap="xs">
                                        <ActionIcon
                                            variant="subtle"
                                            size="sm"
                                            onClick={handleAddCancel}
                                            aria-label="Cancel add"
                                        >
                                            <IconX />
                                        </ActionIcon>
                                        <ActionIcon
                                            color="green"
                                            variant="subtle"
                                            size="sm"
                                            onClick={handleAddSave}
                                            loading={createAssignment.isPending}
                                            disabled={!addTeamId}
                                            aria-label="Save add"
                                        >
                                            <IconCheck />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            )}

            <Group justify="flex-end" mt="sm">
                <Button
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    size="sm"
                    onClick={handleAddOpen}
                    disabled={isAdding || !!editingId}
                >
                    Add team assignment
                </Button>
            </Group>
        </>
    );
}
