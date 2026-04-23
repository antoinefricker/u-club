import { Navigate, Outlet } from 'react-router';
import { useAuthContext } from '../auth/useAuthContext';

export function AdminGuard() {
  const { user } = useAuthContext();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
