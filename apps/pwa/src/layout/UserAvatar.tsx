import { Avatar, Menu } from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { useAuth } from '../auth/useAuth';

function getInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface UserAvatarProps {
  onEditAccount: () => void;
}

export function UserAvatar({ onEditAccount }: UserAvatarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Avatar radius="lg" color="blue" style={{ cursor: 'pointer' }}>
          {getInitials(user.displayName)}
        </Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconUser size={16} />} onClick={onEditAccount}>
          Mon compte
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={logout}
        >
          Se déconnecter
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
