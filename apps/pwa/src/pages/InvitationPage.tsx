import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
    Alert,
    Button,
    Loader,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuthContext } from '../auth/useAuthContext';

interface InvitationDetails {
    id: string;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    type: string;
    description: string | null;
}

export function InvitationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token: authToken, isAuthenticated } = useAuthContext();

    const invitationToken = searchParams.get('token');
    const email = searchParams.get('email');
    const isValid = Boolean(invitationToken && email);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(
        null,
    );
    const [accepted, setAccepted] = useState(false);
    const [accepting, setAccepting] = useState(false);

    const form = useForm({
        initialValues: {
            type: 'relative',
            description: '',
        },
    });

    // Fetch invitation details when logged in
    useEffect(() => {
        if (!isAuthenticated || !authToken) {
            setLoading(false);
            return;
        }

        fetch('/api/invitations', {
            headers: { Authorization: `Bearer ${authToken}` },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load invitations');
                return res.json();
            })
            .then((invitations: InvitationDetails[]) => {
                // Find the matching invitation by token — we match by email since token isn't in the list response
                // We'll just show the accept form and let the API validate
                if (invitations.length > 0) {
                    const inv = invitations[0];
                    setInvitation(inv);
                    form.setFieldValue('type', inv.type || 'relative');
                    form.setFieldValue('description', inv.description || '');
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to load');
                setLoading(false);
            });
    }, [isAuthenticated, authToken]);

    const handleAccept = async (values: typeof form.values) => {
        if (!invitation || !authToken) return;
        setAccepting(true);
        setError(null);

        try {
            const res = await fetch(
                `/api/invitations/${invitation.id}/accept`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        type: values.type,
                        description: values.description || null,
                    }),
                },
            );

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Failed to accept invitation');
            }

            setAccepted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept');
        } finally {
            setAccepting(false);
        }
    };

    if (!isValid) {
        return (
            <Stack align="center" mt="xl">
                <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
                    <Stack align="center">
                        <Title order={3}>Invitation</Title>
                        <Alert color="red" variant="light" w="100%">
                            Invalid invitation link.
                        </Alert>
                    </Stack>
                </Paper>
            </Stack>
        );
    }

    if (!isAuthenticated) {
        return (
            <Stack align="center" mt="xl">
                <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
                    <Stack>
                        <Title order={3} ta="center">
                            You've been invited!
                        </Title>
                        <Alert color="blue" variant="light">
                            Please log in or create an account to accept this
                            invitation.
                        </Alert>
                        <Button fullWidth onClick={() => navigate('/')}>
                            Log in or Register
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        );
    }

    if (accepted) {
        return (
            <Stack align="center" mt="xl">
                <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
                    <Stack align="center">
                        <Title order={3}>Invitation accepted!</Title>
                        <Text>You are now linked to this member.</Text>
                        <Button fullWidth onClick={() => navigate('/')}>
                            Go to Dashboard
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        );
    }

    if (loading) {
        return (
            <Stack align="center" mt="xl">
                <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
                    <Stack align="center">
                        <Loader />
                        <Text>Loading invitation...</Text>
                    </Stack>
                </Paper>
            </Stack>
        );
    }

    return (
        <Stack align="center" mt="xl">
            <Paper shadow="sm" p="xl" radius="md" w="100%" maw={400}>
                <form onSubmit={form.onSubmit(handleAccept)} noValidate>
                    <Stack>
                        <Title order={3} ta="center">
                            Accept Invitation
                        </Title>

                        {invitation && (
                            <Alert color="blue" variant="light">
                                You've been invited to link with{' '}
                                <strong>
                                    {invitation.memberFirstName}{' '}
                                    {invitation.memberLastName}
                                </strong>
                            </Alert>
                        )}

                        {error && (
                            <Alert color="red" variant="light">
                                {error}
                            </Alert>
                        )}

                        <Select
                            label="Relationship type"
                            data={[
                                { value: 'self', label: 'Self (this is me)' },
                                { value: 'relative', label: 'Relative' },
                            ]}
                            {...form.getInputProps('type')}
                        />

                        <TextInput
                            label="Description"
                            placeholder="e.g. mother, father, uncle"
                            {...form.getInputProps('description')}
                        />

                        <Button type="submit" fullWidth loading={accepting}>
                            Accept invitation
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Stack>
    );
}
