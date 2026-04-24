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
} from '@mantine/core';
import {
    IconCheck,
    IconHandFingerRight,
    IconHeartHandshake,
    IconTrash,
    IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    useUserMembers,
    useUpdateUserMember,
    useDeleteUserMember,
} from '../../../hooks/useUserMembers';

interface RowEdit {
    type: string;
    description: string;
}

export function UserMemberLinks({
    userId,
    useUserPointOfView,
    memberId,
}: UserMemberLinksProps) {
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

    if (bothProvided) {
        console.warn(
            'UserMemberLinks: pass either userId or memberId, not both.',
        );
        return null;
    }

    const getEdit = (rel: {
        id: string;
        type: string;
        description: string | null;
    }): RowEdit =>
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

    const isDirty = (rel: {
        id: string;
        type: string;
        description: string | null;
    }) => {
        const edit = getEdit(rel);
        return (
            edit.type !== rel.type ||
            edit.description !== (rel.description ?? '')
        );
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
                    notifications.show({
                        title: 'Updated',
                        message: 'Relationship updated.',
                        color: 'green',
                    });
                },
            },
        );
    };

    const handleCancel = (rel: {
        id: string;
        type: string;
        description: string | null;
    }) => {
        setEdits((prev) => {
            const next = { ...prev };
            delete next[rel.id];
            return next;
        });
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
                {mode === 'member'
                    ? 'No linked users yet.'
                    : 'No linked members yet.'}
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
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th w={24}>#</Table.Th>
                    <Table.Th>{mode === 'member' ? 'User' : 'Member'}</Table.Th>
                    <Table.Th w={240}>Type</Table.Th>
                    <Table.Th w={80} />
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {relationships.map((rel, index) => {
                    const edit = getEdit(rel);
                    const dirty = isDirty(rel);
                    const showDescription = edit.type !== 'self';

                    return (
                        <>
                            <Table.Tr
                                key={rel.id}
                                style={{
                                    borderBottom: showDescription
                                        ? 'none'
                                        : undefined,
                                }}
                            >
                                <Table.Td
                                    w={24}
                                    style={{
                                        paddingBottom: showDescription
                                            ? 4
                                            : undefined,
                                    }}
                                >
                                    <Text size="xs" c="dimmed">
                                        {index + 1}
                                    </Text>
                                </Table.Td>
                                <Table.Td
                                    style={{
                                        paddingBottom: showDescription
                                            ? 4
                                            : undefined,
                                    }}
                                >
                                    {mode === 'member' ? (
                                        <>
                                            <Text fw={700}>
                                                {rel.userDisplayName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {rel.userEmail}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text fw={700}>
                                            {rel.memberFirstName}{' '}
                                            {rel.memberLastName}
                                        </Text>
                                    )}
                                </Table.Td>
                                <Table.Td
                                    style={{
                                        paddingBottom: showDescription
                                            ? 4
                                            : undefined,
                                    }}
                                >
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
                                        leftSection={
                                            edit.type === 'self' ? (
                                                <IconHandFingerRight
                                                    size={16}
                                                />
                                            ) : (
                                                <IconHeartHandshake size={16} />
                                            )
                                        }
                                    />
                                </Table.Td>
                                <Table.Td
                                    rowSpan={2}
                                    style={{
                                        paddingBottom: showDescription
                                            ? 0
                                            : undefined,
                                    }}
                                >
                                    {dirty ? (
                                        <Group gap="xs">
                                            <ActionIcon
                                                color="green"
                                                variant="light"
                                                size="sm"
                                                onClick={() =>
                                                    handleSave(rel.id)
                                                }
                                                loading={
                                                    updateMutation.isPending
                                                }
                                            >
                                                <IconCheck size={14} />
                                            </ActionIcon>
                                            <ActionIcon
                                                color="gray"
                                                variant="light"
                                                size="sm"
                                                onClick={() =>
                                                    handleCancel(rel)
                                                }
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
                            <Table.Tr
                                key={`description-${rel.id}`}
                                style={{
                                    visibility: showDescription
                                        ? 'visible'
                                        : 'collapse',
                                }}
                            >
                                <Table.Td w={24} style={{ paddingTop: 0 }} />
                                <Table.Td colSpan={2} style={{ paddingTop: 0 }}>
                                    <Group w="100%" align="center" gap="xs">
                                        <Text
                                            size="sm"
                                            style={{
                                                flexShrink: 0,
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
                                            type={
                                                showDescription
                                                    ? 'text'
                                                    : 'hidden'
                                            }
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
                                </Table.Td>
                            </Table.Tr>
                        </>
                    );
                })}
            </Table.Tbody>
        </Table>
    );
}

type UserMemberLinksProps = {
    userId?: string;
    useUserPointOfView: boolean;
    memberId?: string;
};
