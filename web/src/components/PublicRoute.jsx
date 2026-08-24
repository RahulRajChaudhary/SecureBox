import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading')
    return <p className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Loading…</p>;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return children;
}
