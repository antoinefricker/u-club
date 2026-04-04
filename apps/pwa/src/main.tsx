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

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<App />}>
                <Route index element={<DashboardPage />} />
                <Route path="club" element={<ClubPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
