import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { MantineProvider, createTheme } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: [
      '#f5f0f6',
      '#e6dae8',
      '#d1bad5',
      '#bb99c1',
      '#a87db1',
      '#95689d',
      '#875e8e',
      '#724f77',
      '#5d4061',
      '#49324c',
    ],
  },
});
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './auth/AuthContext.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import './main.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import App from './App.tsx';
import { TeamsPage } from './pages/TeamsPage.tsx';
import { ClubPage } from './pages/ClubPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AgendaPage } from './pages/AgendaPage.tsx';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage.tsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx';
import { InvitationPage } from './pages/InvitationPage.tsx';
import { AdminGuard } from './layout/AdminGuard.tsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { ClubsListPage } from './pages/admin/ClubsListPage.tsx';
import { ClubFormPage } from './pages/admin/ClubFormPage.tsx';
import { TeamsListPage } from './pages/admin/TeamsListPage.tsx';
import { TeamFormPage } from './pages/admin/TeamFormPage.tsx';
import { MembersListPage } from './pages/admin/MembersListPage.tsx';
import { MemberFormPage } from './pages/admin/MemberFormPage.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="verify-email" element={<ConfirmEmailPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="invitation" element={<InvitationPage />} />
              <Route element={<App />}>
                <Route index element={<DashboardPage />} />
                <Route path="club" element={<ClubPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="admin" element={<AdminGuard />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="clubs" element={<ClubsListPage />} />
                  <Route path="clubs/new" element={<ClubFormPage />} />
                  <Route path="clubs/:id" element={<ClubFormPage />} />
                  <Route path="teams" element={<TeamsListPage />} />
                  <Route path="teams/new" element={<TeamFormPage />} />
                  <Route path="teams/:id" element={<TeamFormPage />} />
                  <Route path="members" element={<MembersListPage />} />
                  <Route path="members/new" element={<MemberFormPage />} />
                  <Route path="members/:id" element={<MemberFormPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
