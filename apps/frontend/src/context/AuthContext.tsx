import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, setAccessToken, getAccessToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('vocalis_user');
        return savedUser ? JSON.parse(savedUser) : null;
      }
    } catch (e) {}
    return null;
  });

  const [accessTokenState, setAccessTokenState] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('vocalis_access_token') : null;
  });

  const [loading, setLoading] = useState(true);

  const saveAuthSession = (token: string, userData: User) => {
    setAccessToken(token);
    setAccessTokenState(token);
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocalis_access_token', token);
      localStorage.setItem('vocalis_user', JSON.stringify(userData));
    }
  };

  const clearAuthSession = () => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vocalis_access_token');
      localStorage.removeItem('vocalis_user');
    }
  };

  const initAuth = async () => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('vocalis_access_token') : null;
    
    if (savedToken) {
      setAccessToken(savedToken);
      setAccessTokenState(savedToken);
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data?.user) {
          saveAuthSession(savedToken, meRes.data.user);
        }
      } catch (err) {
        try {
          const refreshRes = await api.post('/auth/refresh');
          if (refreshRes.data?.accessToken) {
            const newToken = refreshRes.data.accessToken;
            const meRes = await api.get('/auth/me');
            if (meRes.data?.user) {
              saveAuthSession(newToken, meRes.data.user);
            }
          }
        } catch (refreshErr) {
          clearAuthSession();
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data?.accessToken) {
          const newToken = refreshRes.data.accessToken;
          setAccessToken(newToken);
          const meRes = await api.get('/auth/me');
          if (meRes.data?.user) {
            saveAuthSession(newToken, meRes.data.user);
          }
        }
      } catch (err) {
        clearAuthSession();
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    initAuth();

    const handleLogoutEvent = () => {
      clearAuthSession();
    };

    window.addEventListener('vocalis-logout', handleLogoutEvent);
    return () => window.removeEventListener('vocalis-logout', handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    saveAuthSession(res.data.accessToken, res.data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { username, email, password });
    saveAuthSession(res.data.accessToken, res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    clearAuthSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, accessToken: accessTokenState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

