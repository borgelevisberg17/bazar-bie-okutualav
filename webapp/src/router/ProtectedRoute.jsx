import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    // Pode ser substituído por um componente de spinner/loading
    return <div>A carregar...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // Redireciona para a home se não for admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
