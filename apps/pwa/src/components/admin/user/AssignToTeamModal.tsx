import { useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateTeamAssignment, useTeamAssignments } from '../../../hooks/useTeamAssignments';
import { useTeams } from '../../../hooks/useTeams';
import { TEAM_ROLE_OPTIONS, type TeamRole } from '../../../types/TeamAssignment';

interface AssignToTeamModalProps {
    memberId: string;
    onClose: () => void;
}

export function AssignToTeamModal({ memberId, onClose }: AssignToTeamModalProps) {
    const [teamId, setTeamId] = useState<string | null>(null);
    const [role, setRole] = useState<TeamRole | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { data: teamsData, isLoading: teamsLoading } = useTeams({ itemsPerPage: 100 });
    const { data: memberAssignmentsData } = useTeamAssignments({ memberId, itemsPerPage: 100 });
    const createAssignment = useCreateTeamAssignment();

    const teamOptions =
        teamsData?.data.map((t) => ({
            value: t.id,
            label: t.categoryLabel ? `${t.label} · ${t.categoryLabel}` : t.label,
        })) ?? [];

    const heldRoles = useMemo(() => {
        if (!teamId || !memberAssignmentsData) return new Set<TeamRole>();
        return new Set(memberAssignmentsData.data.filter((a) => a.teamId === teamId).map((a) => a.role));
    }, [teamId, memberAssignmentsData]);

    const availableRoleOptions = TEAM_ROLE_OPTIONS.filter((opt) => !heldRoles.has(opt.value));
    const allRolesHeld = !!teamId && availableRoleOptions.length === 0;
    const effectiveRole = role && !heldRoles.has(role) ? role : null;

    const handleSubmit = () => {
        if (!teamId || !effectiveRole) return;
        setError(null);
        createAssignment.mutate(
            { teamId, memberId, role: effectiveRole },
            {
                onSuccess: () => {
                    notifications.show({
                        title: 'Assigned',
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

    const submitDisabled = !teamId || !effectiveRole || createAssignment.isPending;

    return (
        <Modal opened onClose={onClose} title="Assign member to a team" centered>
            {error && (
                <Alert color="red" variant="light" mb="md">
                    {error}
                </Alert>
            )}
            <Select
                label="Team"
                placeholder="Search teams"
                data={teamOptions}
                searchable
                clearable
                value={teamId}
                onChange={setTeamId}
                nothingFoundMessage={teamsLoading ? 'Loading…' : 'No teams'}
                mb="md"
            />
            <Select
                label="Role"
                placeholder={allRolesHeld ? 'Member already holds every role on this team' : 'Select a role'}
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
                    Assign
                </Button>
            </Group>
        </Modal>
    );
}
