import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../auth/useAuth';

export function AdminGuard() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
