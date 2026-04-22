import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { MantineProvider, createTheme } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  headings: {
    fontFamily: 'Poppins, sans-serif',
    sizes: {
      h2: { fontWeight: '500' },
      h3: { fontWeight: '500' },
    },
  },
  primaryColor: 'brand',
  colors: {
    brand: [
      '#f3f1f4',
      '#e2dde4',
      '#cdc5d0',
      '#b5aab9',
      '#a090a5',
      '#8a7690',
      '#76657c',
      '#5d5060',
      '#4a3f4d',
      '#372f3a',
    ],
    success: [
      '#fafbee',
      '#f3f5d5',
      '#e8edb4',
      '#dde593',
      '#d5df6d',
      '#ced946',
      '#b9c33f',
      '#9ba335',
      '#7c832a',
      '#5d6320',
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
import { TeamCategoriesListPage } from './pages/admin/TeamCategoriesListPage.tsx';
import { TeamCategoryFormPage } from './pages/admin/TeamCategoryFormPage.tsx';
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
                  <Route
                    path="team-categories"
                    element={<TeamCategoriesListPage />}
                  />
                  <Route
                    path="team-categories/new"
                    element={<TeamCategoryFormPage />}
                  />
                  <Route
                    path="team-categories/:id"
                    element={<TeamCategoryFormPage />}
                  />
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
