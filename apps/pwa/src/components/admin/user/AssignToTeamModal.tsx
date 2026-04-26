import { useState } from 'react';
import { Alert, Button, Group, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateTeamAssignment } from '../../../hooks/useTeamAssignments';
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
    const createAssignment = useCreateTeamAssignment();

    const teamOptions =
        teamsData?.data.map((t) => ({
            value: t.id,
            label: t.categoryLabel ? `${t.label} · ${t.categoryLabel}` : t.label,
        })) ?? [];

    const handleSubmit = () => {
        if (!teamId || !role) return;
        setError(null);
        createAssignment.mutate(
            { teamId, memberId, role },
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

    const submitDisabled = !teamId || !role || createAssignment.isPending;

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
                    Assign
                </Button>
            </Group>
        </Modal>
    );
}
