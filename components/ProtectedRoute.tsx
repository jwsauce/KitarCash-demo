import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRole: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { user, role, loading } = useAuth();

  // Still checking auth state — show nothing (loading is handled in AuthProvider)
  if (loading) return null;

  // Not logged in → back to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but wrong role → back to landing page
  // (In production you'd redirect to their correct dashboard instead)
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // Correct role — render the protected page
  return <>{children}</>;
};

export default ProtectedRoute;