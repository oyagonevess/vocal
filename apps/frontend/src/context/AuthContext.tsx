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
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const refreshRes = await api.post('/auth/refresh');
      const token = refreshRes.data.accessToken;
      setAccessToken(token);
      setAccessTokenState(token);

      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
    };

    window.addEventListener('vocalis-logout', handleLogoutEvent);
    return () => window.removeEventListener('vocalis-logout', handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setAccessTokenState(res.data.accessToken);
    setUser(res.data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { username, email, password });
    setAccessToken(res.data.accessToken);
    setAccessTokenState(res.data.accessToken);
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    }
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, accessToken: accessTokenState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

