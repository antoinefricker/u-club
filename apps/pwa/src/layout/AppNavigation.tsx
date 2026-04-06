import {
  IconCalendarWeek,
  IconLayoutDashboard,
  IconLogout,
  IconSettings,
  IconSmartHome,
  IconUserCog,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Group, Title } from '@mantine/core';
import classes from './AppNavigation.module.css';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router';
import type { MouseEvent } from 'react';

export function AppNavigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigateSection =
    (section: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(section);
    };

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <div style={{ color: 'white', fontWeight: 700, fontSize: 28 }}>
            Eggplant
          </div>
        </Group>

        <a href="#" className={classes.link} onClick={navigateSection('')}>
          <IconLayoutDashboard className={classes.linkIcon} stroke={1.5} />
          <span>Dashboard</span>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('club')}>
          <IconSmartHome className={classes.linkIcon} stroke={1.5} />
          <span>My club</span>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('teams')}>
          <IconUsersGroup className={classes.linkIcon} stroke={1.5} />
          <span>My teams</span>
        </a>

        <a
          href="#"
          className={classes.link}
          onClick={navigateSection('agenda')}
        >
          <IconCalendarWeek className={classes.linkIcon} stroke={1.5} />
          <span>Agenda</span>
        </a>
      </div>

      <div className={classes.footer}>
        <Title order={6} c="white">
          {user?.displayName}
        </Title>

        {user?.role === 'admin' && (
          <a
            href="#"
            className={classes.link}
            onClick={navigateSection('admin')}
          >
            <IconSettings className={classes.linkIcon} stroke={1.5} />
            <span>Administration</span>
          </a>
        )}

        <a
          href="#"
          className={classes.link}
          onClick={navigateSection('account')}
        >
          <IconUserCog className={classes.linkIcon} stroke={1.5} />
          <span>Edit account</span>
        </a>

        <a href="#" className={classes.link} onClick={logout}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </nav>
  );
}
