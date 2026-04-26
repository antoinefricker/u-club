import { useState } from 'react';
import {
    Alert,
    Loader,
    Select,
    Table,
    TextInput,
    Text,
    ActionIcon,
    Group,
    Tooltip,
    useMantineTheme,
} from '@mantine/core';
import { IconCheck, IconArrowForward, IconTrash, IconUserPlus, IconX, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUserMembers, useUpdateUserMember, useDeleteUserMember } from '../../../hooks/useUserMembers';
import { InviteUserModal } from './InviteUserModal';

interface InvitingFor {
    memberId: string;
    firstName: string;
    lastName: string;
}

interface RowEdit {
    type: string;
    description: string;
}

export function UserMemberLinks({ userId, useUserPointOfView, memberId }: UserMemberLinksProps) {
    const theme = useMantineTheme();
    const bothProvided = !!(userId && memberId);
    const mode: 'user' | 'member' = memberId ? 'member' : 'user';
    const { data, isLoading, error } = useUserMembers({
        itemsPerPage: 100,
        userId: bothProvided ? undefined : userId,
        memberId: bothProvided ? undefined : memberId,
    });
    const relationships = data?.data;
    const updateMutation = useUpdateUserMember();
    const deleteMutation = useDeleteUserMember();
    const [edits, setEdits] = useState<Record<string, RowEdit>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [invitingFor, setInvitingFor] = useState<InvitingFor | null>(null);

    if (bothProvided) {
        console.warn('UserMemberLinks: pass either userId or memberId, not both.');
        return null;
    }

    const getEdit = (rel: { id: string; type: string; description: string | null }): RowEdit =>
        edits[rel.id] ?? { type: rel.type, description: rel.description ?? '' };

    const setEdit = (id: string, patch: Partial<RowEdit>) => {
        setEdits((prev) => ({
            ...prev,
            [id]: { ...getEditById(id), ...patch },
        }));
    };

    const getEditById = (id: string): RowEdit => {
        if (edits[id]) return edits[id];
        const rel = relationships?.find((r) => r.id === id);
        return { type: rel?.type ?? '', description: rel?.description ?? '' };
    };

    const isDirty = (rel: { id: string; type: string; description: string | null }) => {
        const edit = getEdit(rel);
        return edit.type !== rel.type || edit.description !== (rel.description ?? '');
    };

    const handleEdit = (rel: { id: string; type: string; description: string | null }) => {
        if (editingId && editingId !== rel.id) {
            notifications.show({
                title: 'Another link is being edited',
                message: 'Save or cancel the current edit before editing another link.',
                color: 'orange',
            });
            return;
        }
        setEditingId(rel.id);
    };

    const handleSave = (id: string) => {
        const edit = edits[id];
        if (!edit) return;
        updateMutation.mutate(
            { id, type: edit.type, description: edit.description || null },
            {
                onSuccess: () => {
                    setEdits((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                    });
                    setEditingId(null);
                    notifications.show({
                        title: 'Updated',
                        message: 'Relationship updated.',
                        color: 'green',
                    });
                },
            },
        );
    };

    const handleCancel = (rel: { id: string; type: string; description: string | null }) => {
        setEdits((prev) => {
            const next = { ...prev };
            delete next[rel.id];
            return next;
        });
        setEditingId(null);
    };

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
            <Alert color="blue" variant="light">
                {mode === 'member' ? 'No linked users yet.' : 'No linked members yet.'}
            </Alert>
        );

    const typeOptions = useUserPointOfView
        ? [
              { value: 'self', label: "It's me!" },
              { value: 'relative', label: "It's a relative" },
          ]
        : [
              { value: 'self', label: 'This is them' },
              { value: 'relative', label: 'This is a relative' },
          ];

    return (
        <>
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th w={24}>#</Table.Th>
                        <Table.Th w={260}>{mode === 'member' ? 'User' : 'Member'}</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th w={110} />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {relationships.map((rel, index) => {
                        const isEditing = editingId === rel.id;
                        const edit = getEdit(rel);
                        const dirty = isDirty(rel);
                        const showDescription = edit.type !== 'self';

                        const relationshipName =
                            mode === 'member' ? rel.userDisplayName : `${rel.memberFirstName} ${rel.memberLastName}`;

                        return (
                            <>
                                <Table.Tr key={rel.id} style={{ borderBottom: isEditing ? 'none' : undefined }}>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">
                                            {index + 1}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={700}>
                                            {relationshipName}
                                        </Text>
                                        {mode === 'member' && (
                                            <Text size="xs" c="dimmed" mt={-4}>
                                                {rel.userEmail}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {rel.type === 'self' && (useUserPointOfView ? 'Myself' : 'Itself')}
                                        {rel.type !== 'self' &&
                                            (useUserPointOfView
                                                ? `I am ${rel.memberFirstName}'s ${edit.description || 'relative'}`
                                                : `${rel.userDisplayName} is ${rel.memberFirstName}'s ${rel.description || 'relative'}`)}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap="xs">
                                            <Tooltip
                                                label={`Define your link with ${relationshipName}`}
                                                position="left"
                                                offset={1}
                                            >
                                                <ActionIcon
                                                    color="primary"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Edit your link with ${relationshipName}`}
                                                    onClick={() => handleEdit(rel)}
                                                    loading={updateMutation.isPending}
                                                >
                                                    <IconEdit />
                                                </ActionIcon>
                                            </Tooltip>
                                            {mode === 'user' && (
                                                <Tooltip
                                                    label={`Invite a user to link with ${relationshipName}`}
                                                    position="left"
                                                    offset={1}
                                                >
                                                    <ActionIcon
                                                        color="primary"
                                                        variant="subtle"
                                                        aria-label={`Invite a user to link with ${relationshipName}`}
                                                        onClick={() =>
                                                            setInvitingFor({
                                                                memberId: rel.memberId,
                                                                firstName: rel.memberFirstName,
                                                                lastName: rel.memberLastName,
                                                            })
                                                        }
                                                        size="sm"
                                                    >
                                                        <IconUserPlus />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                            <Tooltip
                                                label={`Delete your link with ${relationshipName}`}
                                                position="left"
                                                offset={1}
                                            >
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    size="sm"
                                                    aria-label={`Delete your link with ${relationshipName}`}
                                                    onClick={() => handleDelete(rel.id)}
                                                    loading={deleteMutation.isPending}
                                                >
                                                    <IconTrash />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                                {isEditing && (
                                    <Table.Tr key={`form-${rel.id}`} bg={theme.colors.gray[1]}>
                                        <Table.Td></Table.Td>
                                        <Table.Td>
                                            <Group w="100%" align="center" gap="xs">
                                                <IconArrowForward size={16} />
                                                <Select
                                                    data={typeOptions}
                                                    value={edit.type}
                                                    onChange={(v) =>
                                                        v &&
                                                        setEdit(rel.id, {
                                                            type: v,
                                                            description: '',
                                                        })
                                                    }
                                                />
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            {edit.type !== 'self' && (
                                                <Group w="100%" align="center" gap="xs">
                                                    <Text
                                                        size="sm"
                                                        style={{
                                                            flexShrink: 0,
                                                            flexGrow: 0,
                                                            flexBasis: 'auto',
                                                        }}
                                                    >
                                                        {useUserPointOfView
                                                            ? `I am ${rel.memberFirstName}'s`
                                                            : `${rel.userDisplayName} is ${rel.memberFirstName}'s`}
                                                    </Text>
                                                    <TextInput
                                                        size="sm"
                                                        width="100%"
                                                        type={showDescription ? 'text' : 'hidden'}
                                                        variant="default"
                                                        placeholder="father, mother..."
                                                        value={edit.description}
                                                        onChange={(e) =>
                                                            setEdit(rel.id, {
                                                                description: e.target.value,
                                                            })
                                                        }
                                                        style={{
                                                            flexShrink: 1,
                                                            flexGrow: 1,
                                                            flexBasis: 'auto',
                                                        }}
                                                    />
                                                </Group>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs">
                                                <ActionIcon
                                                    color="primary"
                                                    variant="subtle"
                                                    size="sm"
                                                    onClick={() => handleCancel(rel)}
                                                >
                                                    <IconX />
                                                </ActionIcon>
                                                <ActionIcon
                                                    color="green"
                                                    variant="subtle"
                                                    size="sm"
                                                    onClick={() => handleSave(rel.id)}
                                                    loading={updateMutation.isPending}
                                                    disabled={!dirty}
                                                >
                                                    <IconCheck />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </>
                        );
                    })}
                </Table.Tbody>
            </Table>
            <InviteUserModal
                opened={invitingFor !== null}
                onClose={() => setInvitingFor(null)}
                memberId={invitingFor?.memberId ?? ''}
                memberFirstName={invitingFor?.firstName}
                memberLastName={invitingFor?.lastName}
            />
        </>
    );
}

type UserMemberLinksProps = {
    userId?: string;
    useUserPointOfView: boolean;
    memberId?: string;
};
