import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus } from '@tabler/icons-react';
import { AddTeamMemberModal } from './AddTeamMemberModal';

interface AddTeamMemberButtonProps {
    teamId: string;
}

export function AddTeamMemberButton({ teamId }: AddTeamMemberButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Button size="sm" leftSection={<IconUserPlus size={16} />} onClick={open}>
                Add member
            </Button>
            {opened && <AddTeamMemberModal teamId={teamId} onClose={close} />}
        </>
    );
}
