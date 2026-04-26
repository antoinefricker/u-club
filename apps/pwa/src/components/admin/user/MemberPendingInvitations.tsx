import { ActionIcon, Alert, Group, Loader, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useDeleteInvitation, usePendingInvitations } from '../../../hooks/useInvitations';

interface MemberPendingInvitationsProps {
    memberId: string;
}

const TYPE_LABELS = {
    self: 'Self',
    relative: 'Relative',
} as const;

function expiryHint(expiresAt: string): string {
    const now = dayjs();
    const exp = dayjs(expiresAt);
    if (exp.isBefore(now)) return 'expired';
    const days = exp.startOf('day').diff(now.startOf('day'), 'day');
    if (days === 0) return 'expires today';
    if (days === 1) return 'expires tomorrow';
    return `expires in ${days} days`;
}

export function MemberPendingInvitations({ memberId }: MemberPendingInvitationsProps) {
    const { data, isLoading, error } = usePendingInvitations({ memberId, itemsPerPage: 100 });
    const invitations = data?.data;
    const deleteMutation = useDeleteInvitation();

    const handleCancel = (id: string) => {
        if (!window.confirm('Cancel this invitation?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                notifications.show({
                    title: 'Cancelled',
                    message: 'Invitation cancelled.',
                    color: 'green',
                });
            },
            onError: (err: Error) => {
                notifications.show({
                    title: 'Cancel failed',
                    message: err.message,
                    color: 'red',
                });
            },
        });
    };

    if (isLoading) return <Loader size="sm" />;
    if (error)
        return (
            <Alert color="red" variant="light">
                Failed to load pending invitations
            </Alert>
        );
    if (!invitations?.length)
        return (
            <Alert color="blue" variant="light">
                No pending invitations.
            </Alert>
        );

    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th w={24}>#</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th w={160}>Type</Table.Th>
                    <Table.Th w={220}>Sent by</Table.Th>
                    <Table.Th w={180}>Sent on</Table.Th>
                    <Table.Th w={60} />
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {invitations.map((invitation, index) => (
                    <Table.Tr key={invitation.id}>
                        <Table.Td>
                            <Text size="xs" c="dimmed">
                                {index + 1}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm" fw={700}>
                                {invitation.email}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{TYPE_LABELS[invitation.type]}</Text>
                            {invitation.description && (
                                <Text size="xs" c="dimmed" mt={-4}>
                                    {invitation.description}
                                </Text>
                            )}
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{invitation.invitedByDisplayName}</Text>
                            <Text size="xs" c="dimmed" mt={-4}>
                                {invitation.invitedByEmail}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm">{dayjs(invitation.createdAt).format('DD/MM/YYYY')}</Text>
                            <Text size="xs" c="dimmed" mt={-4}>
                                {expiryHint(invitation.expiresAt)}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                            <Group justify="flex-end" gap="xs">
                                <Tooltip label="Cancel invitation" position="left" offset={1}>
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        size="sm"
                                        aria-label={`Cancel invitation to ${invitation.email}`}
                                        onClick={() => handleCancel(invitation.id)}
                                        loading={deleteMutation.isPending}
                                    >
                                        <IconTrash />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
