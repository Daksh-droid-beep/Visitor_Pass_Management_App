import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div class="flex items-center justify-center min-h-screen bg-slate-950">
        <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to fallback dashboard based on their role
    switch (user?.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      case 'EMPLOYEE':
        return <Navigate to="/host" replace />;
      case 'SECURITY':
        return <Navigate to="/security" replace />;
      case 'VISITOR':
        return <Navigate to="/visitor" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
