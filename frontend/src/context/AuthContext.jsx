import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const theme = useTheme();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure the saved user has required properties
        return {
          _id: parsedUser._id || parsedUser.id,
          name: parsedUser.name || 'User',
          phoneNumber: parsedUser.phoneNumber,
          role: parsedUser.role,
          orders: parsedUser.orders || [],
          token: parsedUser.token
        };
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data) {
            setUser({
              _id: response.data._id,
              name: response.data.name || 'User',
              phoneNumber: response.data.phoneNumber,
              role: response.data.role,
              orders: response.data.orders || []
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user]);

  const login = async (userData) => {
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    
    // Normalize user data to ensure consistent structure
    const normalizedUser = {
      _id: userData._id || userData.id,
      name: userData.name || userData.user?.name || 'User',
      phoneNumber: userData.phoneNumber || userData.user?.phoneNumber,
      role: userData.role || userData.user?.role,
      orders: userData.orders || userData.user?.orders || [],
      token: userData.token
    };
    
    setUser(normalizedUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    token: user?.token,
    role: user?.role,
    theme
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 