import {
  IconCalendarWeek,
  IconLayoutDashboard,
  IconLogout,
  IconShieldHalf,
  IconCrown,
  IconSettings,
  IconUser,
  IconUserStar,
  IconShirtSport,
  IconUserCog,
  IconUsers,
} from '@tabler/icons-react';
import { Group, Title, Tooltip } from '@mantine/core';
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
          🍆 Eggplant
        </Group>

        <div className={classes.separator} />

        <a href="#" className={classes.link} onClick={navigateSection('')}>
          <IconLayoutDashboard className={classes.linkIcon} stroke={1.5} />
          <span>Dashboard</span>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('club')}>
          <IconShieldHalf className={classes.linkIcon} stroke={1.5} />
          <span>My club</span>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('teams')}>
          <IconShirtSport className={classes.linkIcon} stroke={1.5} />
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

        {user?.role === 'admin' && (
          <>
            <div className={classes.separator} />
            <a
              href="#"
              className={classes.link}
              onClick={navigateSection('admin')}
            >
              <IconSettings className={classes.linkIcon} stroke={1.5} />
              <span>Administration</span>
            </a>
            <a
              href="#"
              className={[classes.link, classes.subLink].join(' ')}
              onClick={navigateSection('admin/clubs')}
            >
              <IconShieldHalf className={classes.linkIcon} stroke={1.5} />
              <span>Clubs</span>
            </a>
            <a
              href="#"
              className={[classes.link, classes.subLink].join(' ')}
              onClick={navigateSection('admin/teams')}
            >
              <IconShirtSport className={classes.linkIcon} stroke={1.5} />
              <span>Teams</span>
            </a>
            <a
              href="#"
              className={[classes.link, classes.subLink].join(' ')}
              onClick={navigateSection('admin/members')}
            >
              <IconUsers className={classes.linkIcon} stroke={1.5} />
              <span>Members</span>
            </a>
          </>
        )}
      </div>

      <div className={[classes.footer, classes.separator].join(' ')}>
        <Group
          className={classes.userIdentity}
          justify="space-between"
          align="center"
        >
          <Title order={5} c="white">
            Hello {user?.displayName}!
          </Title>
          <Tooltip label={user?.role}>
            {user?.role === 'admin' ? (
              <IconCrown size={18} color="white" stroke={1.5} opacity={0.5} />
            ) : user?.role === 'manager' ? (
              <IconUserStar
                size={18}
                color="white"
                stroke={1.5}
                opacity={0.5}
              />
            ) : (
              <IconUser size={18} color="white" stroke={1.5} opacity={0.5} />
            )}
          </Tooltip>
        </Group>

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
