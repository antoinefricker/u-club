import { ActionIcon, Alert, Group, Loader, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTeamAssignments, useDeleteTeamAssignment } from '../../../hooks/useTeamAssignments';
import { TEAM_ROLE_LABELS } from '../../../types/TeamAssignment';
import { TEAM_GENDER_LABELS } from '../../../types/Team';

interface UserTeamAssignmentsProps {
    userId?: string;
    memberId?: string;
    editable?: boolean;
}

export function UserTeamAssignments({ userId, memberId, editable = false }: UserTeamAssignmentsProps = {}) {
    const { data, isLoading, error } = useTeamAssignments({
        itemsPerPage: 100,
        userId,
        memberId,
    });
    const assignments = data?.data;
    const deleteMutation = useDeleteTeamAssignment();

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
                    <Table.Th w={140}>Role</Table.Th>
                    {editable && <Table.Th w={80} />}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {assignments.map((assignment, index) => {
                    const subtitle = [assignment.teamCategoryLabel, TEAM_GENDER_LABELS[assignment.teamGender]]
                        .filter(Boolean)
                        .join(' · ');

                    return (
                        <Table.Tr key={assignment.id}>
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
                                <Text component="span" size="sm">
                                    {assignment.teamLabel}
                                </Text>
                                {subtitle && (
                                    <Text component="span" size="xs" c="dimmed">
                                        &nbsp;/&nbsp;{subtitle}
                                    </Text>
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{TEAM_ROLE_LABELS[assignment.role]}</Text>
                            </Table.Td>
                            {editable && (
                                <Table.Td>
                                    <Group justify="flex-end" gap="xs">
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
