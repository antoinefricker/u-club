import { Title } from '@mantine/core';
import { useAuth } from '../auth/useAuth';
import classes from './AppNavigation.module.css';
import { IconLogout, IconUserCog } from '@tabler/icons-react';

export function AppNavigationAccountFooter() {
  const { user, logout } = useAuth();

  return (
    <>
      <Title order={4}>{user?.displayName}</Title>
      <a
        href="#"
        className={classes.link}
        onClick={(event) => event.preventDefault()}
      >
        <IconUserCog className={classes.linkIcon} stroke={1.5} />
        <span>Edit account</span>
      </a>

      <a href="#" className={classes.link} onClick={logout}>
        <IconLogout className={classes.linkIcon} stroke={1.5} />
        <span>Logout</span>
      </a>
    </>
  );
}
