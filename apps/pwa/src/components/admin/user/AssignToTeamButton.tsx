import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { AssignToTeamModal } from './AssignToTeamModal';

interface AssignToTeamButtonProps {
    memberId: string;
}

export function AssignToTeamButton({ memberId }: AssignToTeamButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Button size="sm" leftSection={<IconPlus size={16} />} onClick={open}>
                Assign to team
            </Button>
            {opened && <AssignToTeamModal memberId={memberId} onClose={close} />}
        </>
    );
}
