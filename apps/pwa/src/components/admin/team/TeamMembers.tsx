import { ActionIcon, Alert, Anchor, Group, Loader, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router';
import { useTeamAssignments, useDeleteTeamAssignment } from '../../../hooks/useTeamAssignments';
import { TEAM_ROLE_LABELS } from '../../../types/TeamAssignment';

interface TeamMembersProps {
    teamId: string;
}

export function TeamMembers({ teamId }: TeamMembersProps) {
    const { data, isLoading, error } = useTeamAssignments({ teamId, itemsPerPage: 100 });
    const assignments = data?.data;
    const deleteMutation = useDeleteTeamAssignment();

    const handleDelete = (id: string, memberName: string) => {
        if (!window.confirm(`Remove ${memberName} from this role?`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Removed',
                    message: 'Role removed.',
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
                    <Table.Th w={80} />
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {assignments.map((assignment, index) => {
                    const memberName = `${assignment.memberFirstName} ${assignment.memberLastName}`;

                    return (
                        <Table.Tr key={assignment.id}>
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
                                <Text size="sm">{TEAM_ROLE_LABELS[assignment.role]}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Group justify="flex-end" gap="xs">
                                    <Tooltip label={`Remove ${memberName} from this role`} position="left" offset={1}>
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            size="sm"
                                            aria-label={`Remove ${memberName} from this role`}
                                            onClick={() => handleDelete(assignment.id, memberName)}
                                            loading={deleteMutation.isPending}
                                        >
                                            <IconTrash />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}
