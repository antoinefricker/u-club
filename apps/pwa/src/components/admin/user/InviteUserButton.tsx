import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus } from '@tabler/icons-react';
import { InviteUserModal } from './InviteUserModal';

interface InviteUserButtonProps {
    memberId: string;
    memberFirstName?: string;
    memberLastName?: string;
}

export function InviteUserButton({ memberId, memberFirstName, memberLastName }: InviteUserButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Button size="sm" leftSection={<IconUserPlus size={16} />} onClick={open}>
                Invite user
            </Button>
            <InviteUserModal
                opened={opened}
                onClose={close}
                memberId={memberId}
                memberFirstName={memberFirstName}
                memberLastName={memberLastName}
            />
        </>
    );
}
