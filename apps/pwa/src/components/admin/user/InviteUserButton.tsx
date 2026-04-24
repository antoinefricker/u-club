import { Button, Group, Modal, Select, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconHandFingerRight, IconHeartHandshake, IconUserPlus } from '@tabler/icons-react';
import { useCreateInvitation } from '../../../hooks/useInvitations';
import { emailValidation } from '../../../utils/formValidations/emailValidation';

interface InviteUserButtonProps {
    memberId: string;
    memberFirstName?: string;
    memberLastName?: string;
}

interface InviteFormValues {
    email: string;
    type: 'self' | 'relative';
    description: string;
}

export function InviteUserButton({ memberId, memberFirstName, memberLastName }: InviteUserButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const createInvitation = useCreateInvitation();

    const form = useForm<InviteFormValues>({
        initialValues: { email: '', type: 'relative', description: '' },
        validate: { email: emailValidation },
    });

    const memberFullName = [memberFirstName, memberLastName].filter(Boolean).join(' ');
    const modalTitle = memberFullName
        ? `Invite a user to link with ${memberFullName}`
        : 'Invite a user to link with this member';
    const descriptionLabel = memberFirstName ? `They are ${memberFirstName}'s` : 'Their relationship';

    const handleSubmit = (values: InviteFormValues) => {
        createInvitation.mutate(
            {
                memberId,
                email: values.email,
                type: values.type,
                description: values.type === 'relative' && values.description.trim() ? values.description.trim() : null,
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: 'Invitation sent',
                        message: `An invitation has been sent to ${values.email}.`,
                        color: 'green',
                    });
                    form.reset();
                    close();
                },
                onError: (error: Error) => {
                    notifications.show({
                        title: 'Failed to send invitation',
                        message: error.message,
                        color: 'red',
                    });
                },
            },
        );
    };

    const handleClose = () => {
        if (createInvitation.isPending) return;
        form.reset();
        close();
    };

    const showDescription = form.values.type === 'relative';

    return (
        <>
            <Button size="sm" leftSection={<IconUserPlus size={16} />} onClick={open}>
                Invite user
            </Button>

            <Modal opened={opened} onClose={handleClose} title={modalTitle} centered>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Email"
                        placeholder="invited.user@example.com"
                        required
                        type="email"
                        {...form.getInputProps('email')}
                    />
                    <Select
                        label="Relationship"
                        mt="md"
                        required
                        data={[
                            { value: 'self', label: "It's me!" },
                            { value: 'relative', label: "It's a relative" },
                        ]}
                        allowDeselect={false}
                        leftSection={
                            form.values.type === 'self' ? (
                                <IconHandFingerRight size={16} />
                            ) : (
                                <IconHeartHandshake size={16} />
                            )
                        }
                        {...form.getInputProps('type')}
                    />
                    {showDescription && (
                        <TextInput
                            label={descriptionLabel}
                            mt="md"
                            placeholder="father, mother…"
                            {...form.getInputProps('description')}
                        />
                    )}
                    <Group justify="flex-end" mt="xl">
                        <Button variant="subtle" onClick={handleClose} disabled={createInvitation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createInvitation.isPending}>
                            Send invite
                        </Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}
