import { Alert, Loader, Table, Text } from '@mantine/core';
import { useTeamAssignments } from '../../../hooks/useTeamAssignments';
import { TEAM_ROLE_LABELS } from '../../../types/TeamAssignment';
import { TEAM_GENDER_LABELS } from '../../../types/Team';

interface UserTeamAssignmentsProps {
    userId?: string;
    memberId?: string;
}

export function UserTeamAssignments({ userId, memberId }: UserTeamAssignmentsProps = {}) {
    const { data, isLoading, error } = useTeamAssignments({
        itemsPerPage: 100,
        userId,
        memberId,
    });
    const assignments = data?.data;

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
                    <Table.Th>Team</Table.Th>
                    <Table.Th w={220}>Member</Table.Th>
                    <Table.Th w={140}>Role</Table.Th>
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
                                <Text size="sm" fw={700}>
                                    {assignment.teamLabel}
                                </Text>
                                {subtitle && (
                                    <Text size="xs" c="dimmed" mt={-4}>
                                        {subtitle}
                                    </Text>
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">
                                    {assignment.memberFirstName} {assignment.memberLastName}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{TEAM_ROLE_LABELS[assignment.role]}</Text>
                            </Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}
