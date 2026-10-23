import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyExistingSession() {
      const savedUser = localStorage.getItem('jrms_user');
      const savedToken = localStorage.getItem('jrms_token');

      if (savedUser && savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('jrms_user', JSON.stringify(res.data.user));
          } else {
            throw new Error('Invalid session response');
          }
        } catch {
          // Token expired, revoked, or server rejected
          localStorage.removeItem('jrms_user');
          localStorage.removeItem('jrms_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    verifyExistingSession();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data?.success && response.data?.token) {
        const { token, user: userData } = response.data;
        localStorage.setItem('jrms_token', token);
        localStorage.setItem('jrms_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
      return {
        success: false,
        message: response.data?.message || 'Invalid username or password.'
      };
    } catch (err) {
      const message = err.response?.data?.message ||
        (err.response?.status === 503 ? 'Database service unavailable. Graph database connection offline.' : 'Authentication failed. Please check network connection.');
      return {
        success: false,
        message,
        status: err.response?.status
      };
    }
  };

  const quickLogin = async (role) => {
    // Seeded actor credentials for local development environment
    const userMap = {
      USER: { username: 'recruiter', password: 'User@123' },
      DATABASE_DESIGNER: { username: 'designer', password: 'Designer@123' },
      DBA: { username: 'dba_admin', password: 'Dba@123' }
    };

    const target = userMap[role] || userMap.USER;

    try {
      const response = await api.post('/auth/login', {
        username: target.username,
        password: target.password
      });

      if (response.data?.success && response.data?.token) {
        const { token, user: backendUser } = response.data;
        localStorage.setItem('jrms_token', token);
        localStorage.setItem('jrms_user', JSON.stringify(backendUser));
        setUser(backendUser);
        return { success: true, user: backendUser };
      }

      return {
        success: false,
        message: response.data?.message || 'Login failed.'
      };
    } catch (err) {
      const message = err.response?.data?.message ||
        (err.response?.status === 503 ? 'Database service unavailable. Graph database is offline.' : 'Failed to connect to authentication service.');
      return {
        success: false,
        message,
        status: err.response?.status
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Non-fatal if logout endpoint fails
    }
    localStorage.removeItem('jrms_token');
    localStorage.removeItem('jrms_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, quickLogin, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
