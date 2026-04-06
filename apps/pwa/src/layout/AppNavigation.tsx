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
import { Box, Title } from '@mantine/core';
import classes from './AppNavigation.module.css';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router';
import type { MouseEvent } from 'react';

interface AppNavigationProps {
  onNavigate?: () => void;
}

export function AppNavigation({ onNavigate }: AppNavigationProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigateSection =
    (section: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(section);
      onNavigate?.();
    };

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Box visibleFrom="sm">
          <div className={classes.header}>
            <Title order={2} c="white">
              🍆 eggplant
            </Title>
          </div>

          <div className={classes.separator} />
        </Box>

        <a href="#" className={classes.link} onClick={navigateSection('')}>
          <IconLayoutDashboard className={classes.linkIcon} stroke={1.5} />
          <Title order={3} size="sm">
            Dashboard
          </Title>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('club')}>
          <IconShieldHalf className={classes.linkIcon} stroke={1.5} />
          <Title order={3} size="sm">
            My clubs
          </Title>
        </a>

        <a href="#" className={classes.link} onClick={navigateSection('teams')}>
          <IconShirtSport className={classes.linkIcon} stroke={1.5} />
          <Title order={3} size="sm">
            My teams
          </Title>
        </a>

        <a
          href="#"
          className={classes.link}
          onClick={navigateSection('agenda')}
        >
          <IconCalendarWeek className={classes.linkIcon} stroke={1.5} />
          <Title order={3} size="sm">
            Agenda
          </Title>
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
              <Title order={3} size="sm">
                Administration
              </Title>
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
        <div className={classes.link}>
          {user?.role === 'admin' ? (
            <IconCrown className={classes.linkIcon} stroke={1.5} />
          ) : user?.role === 'manager' ? (
            <IconUserStar className={classes.linkIcon} stroke={1.5} />
          ) : (
            <IconUser className={classes.linkIcon} stroke={1.5} />
          )}
          <Title order={3} size="sm">
            Hello {user?.displayName}!
          </Title>
        </div>

        <a
          href="#"
          className={[classes.link, classes.subLink].join(' ')}
          onClick={navigateSection('account')}
        >
          <IconUserCog className={classes.linkIcon} stroke={1.5} />
          <span>Edit account</span>
        </a>

        <a
          href="#"
          className={[classes.link, classes.subLink].join(' ')}
          onClick={logout}
        >
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </nav>
  );
}
