import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('jrms_user');
    const savedToken = localStorage.getItem('jrms_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('jrms_user');
        localStorage.removeItem('jrms_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data?.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('jrms_token', token);
        localStorage.setItem('jrms_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch {
      // Fallback for cloud/hosted Vercel environments
    }

    // Determine role from username for academic demo
    let role = 'USER';
    let fullName = 'Alex Mercer (Recruitment Lead)';
    if (username.toLowerCase().includes('design')) {
      role = 'DATABASE_DESIGNER';
      fullName = 'Dr. Elena Rostova (Schema Architect)';
    } else if (username.toLowerCase().includes('dba') || username.toLowerCase().includes('admin')) {
      role = 'DBA';
      fullName = 'Marcus Vance (Chief DBA)';
    }

    const userData = { username, role, full_name: fullName };
    const mockToken = 'jwt_token_' + role.toLowerCase();
    localStorage.setItem('jrms_token', mockToken);
    localStorage.setItem('jrms_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const quickLogin = async (role) => {
    const userMap = {
      USER: { username: 'recruiter', role: 'USER', full_name: 'Alex Mercer (Recruitment Lead)' },
      DATABASE_DESIGNER: { username: 'designer', role: 'DATABASE_DESIGNER', full_name: 'Dr. Elena Rostova (Schema Architect)' },
      DBA: { username: 'dba_admin', role: 'DBA', full_name: 'Marcus Vance (Chief DBA)' }
    };

    const userData = userMap[role] || userMap.USER;
    const mockToken = 'jwt_token_quick_' + userData.role.toLowerCase();
    localStorage.setItem('jrms_token', mockToken);
    localStorage.setItem('jrms_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
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
