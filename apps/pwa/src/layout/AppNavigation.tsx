import {
    IconCalendarWeek,
    IconCategory,
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
import { Box, Title, UnstyledButton } from '@mantine/core';
import classes from './AppNavigation.module.css';
import { useAuthContext } from '../auth/useAuthContext';
import { Link } from 'react-router';

interface AppNavigationProps {
    onNavigate?: () => void;
}

export function AppNavigation({ onNavigate }: AppNavigationProps) {
    const { user, logout } = useAuthContext();

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

                <Link to="/" className={classes.link} onClick={onNavigate}>
                    <IconLayoutDashboard className={classes.linkIcon} stroke={1.5} />
                    <Title order={3} size="sm">
                        Dashboard
                    </Title>
                </Link>

                <Link to="/teams" className={classes.link} onClick={onNavigate}>
                    <IconShirtSport className={classes.linkIcon} stroke={1.5} />
                    <Title order={3} size="sm">
                        My teams
                    </Title>
                </Link>

                <Link to="/agenda" className={classes.link} onClick={onNavigate}>
                    <IconCalendarWeek className={classes.linkIcon} stroke={1.5} />
                    <Title order={3} size="sm">
                        Agenda
                    </Title>
                </Link>

                {user?.role === 'admin' && (
                    <>
                        <div className={classes.separator} />
                        <Link to="/admin" className={classes.link} onClick={onNavigate}>
                            <IconSettings className={classes.linkIcon} stroke={1.5} />
                            <Title order={3} size="sm">
                                Administration
                            </Title>
                        </Link>
                        <Link
                            to="/admin/clubs"
                            className={[classes.link, classes.subLink].join(' ')}
                            onClick={onNavigate}
                        >
                            <IconShieldHalf className={classes.linkIcon} stroke={1.5} />
                            <span>Clubs</span>
                        </Link>
                        <Link
                            to="/admin/teams"
                            className={[classes.link, classes.subLink].join(' ')}
                            onClick={onNavigate}
                        >
                            <IconShirtSport className={classes.linkIcon} stroke={1.5} />
                            <span>Teams</span>
                        </Link>
                        <Link
                            to="/admin/team-categories"
                            className={[classes.link, classes.subLink].join(' ')}
                            onClick={onNavigate}
                        >
                            <IconCategory className={classes.linkIcon} stroke={1.5} />
                            <span>Team categories</span>
                        </Link>
                        <Link
                            to="/admin/members"
                            className={[classes.link, classes.subLink].join(' ')}
                            onClick={onNavigate}
                        >
                            <IconUsers className={classes.linkIcon} stroke={1.5} />
                            <span>Members</span>
                        </Link>
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

                <Link to="/account" className={[classes.link, classes.subLink].join(' ')} onClick={onNavigate}>
                    <IconUserCog className={classes.linkIcon} stroke={1.5} />
                    <span>Edit account</span>
                </Link>

                <UnstyledButton className={[classes.link, classes.subLink].join(' ')} onClick={logout}>
                    <IconLogout className={classes.linkIcon} stroke={1.5} />
                    <span>Logout</span>
                </UnstyledButton>
            </div>
        </nav>
    );
}
