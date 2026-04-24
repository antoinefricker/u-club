import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
    Alert,
    Button,
    Center,
    Container,
    Group,
    Loader,
    Paper,
    PasswordInput,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconHandFingerRight, IconHeartHandshake } from '@tabler/icons-react';
import { useAuthContext } from '../auth/useAuthContext';
import { useInvitationByToken, useRegisterAndAcceptInvitation, type InvitationByToken } from '../hooks/useInvitations';

export function InvitationPage() {
    const [searchParams] = useSearchParams();
    const invitationToken = searchParams.get('token');
    const { isAuthenticated } = useAuthContext();

    const { data, isLoading, error } = useInvitationByToken(invitationToken);

    return (
        <Container size="xs" py="xl">
            <Paper shadow="sm" p="xl" radius="md">
                <Stack>
                    <Title order={2} ta="center">
                        You&apos;ve been invited!
                    </Title>

                    {!invitationToken ? (
                        <InvalidTokenAlert message="This invitation link is missing a token." />
                    ) : isLoading ? (
                        <Center py="xl">
                            <Loader />
                        </Center>
                    ) : error || !data ? (
                        <InvalidTokenAlert
                            message={error?.message ?? 'This invitation link is invalid or has expired.'}
                        />
                    ) : (
                        <InvitationBody
                            invitation={data.invitation}
                            userExists={data.userExists}
                            invitationToken={invitationToken}
                            isAuthenticated={isAuthenticated}
                        />
                    )}
                </Stack>
            </Paper>
        </Container>
    );
}

function InvalidTokenAlert({ message }: { message: string }) {
    const navigate = useNavigate();
    return (
        <Stack>
            <Alert color="red" variant="light">
                {message}
            </Alert>
            <Button variant="subtle" onClick={() => navigate('/')}>
                Go to home
            </Button>
        </Stack>
    );
}

function InvitationBody({
    invitation,
    userExists,
    invitationToken,
    isAuthenticated,
}: {
    invitation: InvitationByToken;
    userExists: boolean;
    invitationToken: string;
    isAuthenticated: boolean;
}) {
    return (
        <Stack>
            <Text ta="center">
                <Text span fw={700}>
                    {invitation.memberFirstName} {invitation.memberLastName}
                </Text>
                {' would like to link their account with you.'}
            </Text>

            {isAuthenticated ? (
                <AcceptForm invitation={invitation} />
            ) : userExists ? (
                <LoginAndAcceptForm invitation={invitation} />
            ) : (
                <RegisterAndAcceptForm invitation={invitation} invitationToken={invitationToken} />
            )}
        </Stack>
    );
}

function AcceptForm({ invitation }: { invitation: InvitationByToken }) {
    const navigate = useNavigate();
    const { token: authToken } = useAuthContext();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            type: invitation.type,
            description: invitation.description ?? '',
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (!authToken) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/invitations/${invitation.id}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    type: values.type,
                    description: values.description.trim() || null,
                }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to accept invitation');
            }
            notifications.show({
                title: 'Invitation accepted',
                message: `You are now linked to ${invitation.memberFirstName} ${invitation.memberLastName}.`,
                color: 'green',
            });
            navigate('/');
        } catch (err) {
            notifications.show({
                title: 'Failed to accept invitation',
                message: err instanceof Error ? err.message : 'Unknown error',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const showDescription = form.values.type !== 'self';

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
                <TextInput label="Email" value={invitation.email} disabled />
                <Select
                    label="Relationship"
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
                        label={`You are ${invitation.memberFirstName}'s`}
                        placeholder="father, mother…"
                        {...form.getInputProps('description')}
                    />
                )}
                <Group justify="flex-end" mt="md">
                    <Button type="submit" loading={submitting}>
                        Accept invitation
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

function LoginAndAcceptForm({ invitation }: { invitation: InvitationByToken }) {
    const { login } = useAuthContext();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: { password: '' },
        validate: {
            password: (v) => (v.length === 0 ? 'Password is required' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        try {
            await login(invitation.email, values.password);
            // On success the page re-renders authenticated and AcceptForm takes over.
        } catch (err) {
            notifications.show({
                title: 'Login failed',
                message: err instanceof Error ? err.message : 'Unknown error',
                color: 'red',
            });
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
                <Alert color="blue" variant="light">
                    An account already exists for this email. Log in to accept the invitation.
                </Alert>
                <TextInput label="Email" value={invitation.email} disabled />
                <PasswordInput label="Password" required {...form.getInputProps('password')} />
                <Group justify="flex-end" mt="md">
                    <Button type="submit" loading={submitting}>
                        Log in &amp; accept
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

function RegisterAndAcceptForm({
    invitation,
    invitationToken,
}: {
    invitation: InvitationByToken;
    invitationToken: string;
}) {
    const navigate = useNavigate();
    const { hydrate } = useAuthContext();
    const mutation = useRegisterAndAcceptInvitation(invitationToken);

    const form = useForm({
        initialValues: { displayName: '', password: '' },
        validate: {
            displayName: (v) => (v.trim().length === 0 ? 'Display name is required' : null),
            password: (v) => (v.length < 8 ? 'Password must be at least 8 characters' : null),
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        mutation.mutate(
            { displayName: values.displayName.trim(), password: values.password },
            {
                onSuccess: ({ accessToken }) => {
                    hydrate(accessToken);
                    notifications.show({
                        title: 'Welcome to Eggplant!',
                        message: `You are now linked to ${invitation.memberFirstName} ${invitation.memberLastName}.`,
                        color: 'green',
                    });
                    navigate('/');
                },
                onError: (err: Error) => {
                    notifications.show({
                        title: 'Failed to create account',
                        message: err.message,
                        color: 'red',
                    });
                },
            },
        );
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
                <Alert color="blue" variant="light">
                    Create your account to accept the invitation.
                </Alert>
                <TextInput label="Email" value={invitation.email} disabled />
                <TextInput label="Display name" required {...form.getInputProps('displayName')} />
                <PasswordInput
                    label="Password"
                    required
                    description="At least 8 characters"
                    {...form.getInputProps('password')}
                />
                <Group justify="flex-end" mt="md">
                    <Button type="submit" loading={mutation.isPending}>
                        Create account &amp; accept
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
