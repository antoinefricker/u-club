import { useState } from 'react';
import { Alert, Button, Group, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateTeamAssignment } from '../../../hooks/useTeamAssignments';
import { useMembers } from '../../../hooks/useMembers';
import { TEAM_ROLE_OPTIONS, type TeamRole } from '../../../types/TeamAssignment';

interface AddTeamMemberModalProps {
    teamId: string;
    onClose: () => void;
}

export function AddTeamMemberModal({ teamId, onClose }: AddTeamMemberModalProps) {
    const [memberSearch, setMemberSearch] = useState('');
    const [memberId, setMemberId] = useState<string | null>(null);
    const [role, setRole] = useState<TeamRole | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { data: membersData, isLoading: membersLoading } = useMembers({
        search: memberSearch || undefined,
        itemsPerPage: 50,
    });
    const createAssignment = useCreateTeamAssignment();

    const memberOptions =
        membersData?.data.map((m) => ({
            value: m.id,
            label: `${m.firstName} ${m.lastName}`,
        })) ?? [];

    const handleSubmit = () => {
        if (!memberId || !role) return;
        setError(null);
        createAssignment.mutate(
            { teamId, memberId, role },
            {
                onSuccess: () => {
                    notifications.show({
                        title: 'Member added',
                        message: 'Member assigned to the team.',
                        color: 'green',
                    });
                    onClose();
                },
                onError: (err: Error) => {
                    setError(err.message);
                },
            },
        );
    };

    const submitDisabled = !memberId || !role || createAssignment.isPending;

    return (
        <Modal opened onClose={onClose} title="Add member to team" centered>
            {error && (
                <Alert color="red" variant="light" mb="md">
                    {error}
                </Alert>
            )}
            <Select
                label="Member"
                placeholder="Search members"
                data={memberOptions}
                searchable
                clearable
                searchValue={memberSearch}
                onSearchChange={setMemberSearch}
                value={memberId}
                onChange={setMemberId}
                nothingFoundMessage={membersLoading ? 'Loading…' : 'No members'}
                mb="md"
            />
            <Select
                label="Role"
                placeholder="Select a role"
                data={TEAM_ROLE_OPTIONS}
                value={role}
                onChange={(v) => setRole(v as TeamRole | null)}
                mb="md"
            />
            <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitDisabled} loading={createAssignment.isPending}>
                    Add
                </Button>
            </Group>
        </Modal>
    );
}
