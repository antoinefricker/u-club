import { AppShell, Box, Group, NavLink, Title } from '@mantine/core';
import {
  IconArrowLeft,
  IconBuildingCommunity,
  IconShirtSport,
  IconUsers,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router';

const NAV_ITEMS = [
  { label: 'Clubs', icon: IconBuildingCommunity, path: '/admin/clubs' },
  { label: 'Teams', icon: IconShirtSport, path: '/admin/teams' },
  { label: 'Members', icon: IconUsers, path: '/admin/members' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell navbar={{ width: 250, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md">
        <Group mb="md">
          <Title order={4}>Administration</Title>
        </Group>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}

        <NavLink
          label="Back to app"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate('/')}
          mt="auto"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1200} ml="auto">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
