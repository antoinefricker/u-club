import type { ReactNode } from 'react';
import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AppNavigation } from './AppNavigation';
import { useAuthContext } from '../auth/useAuthContext';
import { Unauthenticated } from '../pages/unauthenticated/Unauthenticated';

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { user } = useAuthContext();
    const [opened, { toggle, close }] = useDisclosure();

    if (!user) {
        return (
            <AppShell bg="#bbb3a0" h="100%">
                <Unauthenticated />
            </AppShell>
        );
    }

    return (
        <AppShell
            bg="white"
            header={{ height: { base: 46, sm: 0 } }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header
                hiddenFrom="sm"
                bg="var(--mantine-primary-color-5)"
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="xs" align="center" c="white" fw={700} fz={20}>
                        🍆 eggplant
                    </Group>
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        color="white"
                        size="sm"
                    />
                </Group>
            </AppShell.Header>

            <AppShell.Navbar>
                <AppNavigation onNavigate={close} />
            </AppShell.Navbar>

            <AppShell.Main py="xs">{children}</AppShell.Main>
        </AppShell>
    );
}
