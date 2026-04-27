import { useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateTeamAssignment, useTeamAssignments } from '../../../hooks/useTeamAssignments';
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
    const { data: teamAssignmentsData } = useTeamAssignments({ teamId, itemsPerPage: 100 });
    const createAssignment = useCreateTeamAssignment();

    const memberOptions =
        membersData?.data.map((m) => ({
            value: m.id,
            label: `${m.firstName} ${m.lastName}`,
        })) ?? [];

    const heldRoles = useMemo(() => {
        if (!memberId || !teamAssignmentsData) return new Set<TeamRole>();
        return new Set(teamAssignmentsData.data.filter((a) => a.memberId === memberId).map((a) => a.role));
    }, [memberId, teamAssignmentsData]);

    const availableRoleOptions = TEAM_ROLE_OPTIONS.filter((opt) => !heldRoles.has(opt.value));
    const allRolesHeld = !!memberId && availableRoleOptions.length === 0;
    const effectiveRole = role && !heldRoles.has(role) ? role : null;

    const handleSubmit = () => {
        if (!memberId || !effectiveRole) return;
        setError(null);
        createAssignment.mutate(
            { teamId, memberId, role: effectiveRole },
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

    const submitDisabled = !memberId || !effectiveRole || createAssignment.isPending;

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
                placeholder={allRolesHeld ? 'Member already holds every role' : 'Select a role'}
                data={availableRoleOptions}
                value={effectiveRole}
                onChange={(v) => setRole(v as TeamRole | null)}
                disabled={allRolesHeld}
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
