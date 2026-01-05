import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        try {
          // O token já está a ser enviado pelo intercetor da API
          const response = await getProfile();
          setUser(response.data.user);
        } catch (error) {
          console.error('Sessão inválida, a fazer logout.', error);
          localStorage.removeItem('user_session');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem('user_session', JSON.stringify({ token, user: userData }));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
