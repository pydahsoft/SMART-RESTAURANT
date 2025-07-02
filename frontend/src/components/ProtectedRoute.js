import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { token } = useAuth();
  const waiterToken = localStorage.getItem('waiterToken');

  // Handle waiter routes
  if (requiredRole === 'waiter') {
    if (!waiterToken) {
      return <Navigate to="/waiter-login" replace />;
    }
    return children;
  }

  // Handle other protected routes
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;