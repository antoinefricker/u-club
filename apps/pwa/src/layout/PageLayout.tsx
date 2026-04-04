import type { ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { AppNavigation } from './AppNavigation';
import { useAuth } from '../auth/useAuth';
import { Unauthenticated } from './Unauthenticated';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <AppShell bg="#95689d" h="100%">
        <Unauthenticated />
      </AppShell>
    );
  }

  return (
    <AppShell
      bg="white"
      navbar={{ width: 300, breakpoint: 'sm' }}
      header={{ height: 0 }}
      padding={0}
    >
      <AppShell.Navbar>
        <AppNavigation />
      </AppShell.Navbar>
      <AppShell.Main
        style={{ '--app-shell-header-offset': '0px' } as React.CSSProperties}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
