import { SimpleGrid, Paper, Stack, Text } from '@mantine/core';
import { PageTitle } from '../../components/layout/PageTitle';
import { IconShieldHalf, IconUsers, IconShirtSport } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

const cards = [
  { label: 'Clubs', icon: IconShieldHalf, path: '/admin/clubs' },
  { label: 'Teams', icon: IconShirtSport, path: '/admin/teams' },
  { label: 'Members', icon: IconUsers, path: '/admin/members' },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageTitle label="Administration" />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {cards.map((card) => (
          <Paper
            key={card.label}
            p="xl"
            shadow="xs"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(card.path)}
          >
            <Stack align="center" gap="xs">
              <card.icon size={40} stroke={1.5} />
              <Text fw={500} size="lg">
                {card.label}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </>
  );
}
