import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(Cookies.get('auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = Cookies.get('auth_token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      Cookies.remove('auth_token');
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      const response = await axios.post('/auth/register', formData);

      // Registration successful, but user needs to verify email
      // Don't log them in yet
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Błąd podczas rejestracji'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data;

      // Store token in cookie (expires in 7 days, secure in production)
      Cookies.set('auth_token', newToken, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Błąd podczas logowania'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Błąd podczas wysyłania linku resetującego'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post('/auth/reset-password', { token, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Błąd podczas zmiany hasła'
      };
    }
  };

  const logout = () => {
    Cookies.remove('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    register,
    login,
    forgotPassword,
    resetPassword,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
