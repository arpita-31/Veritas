import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoPersona } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  switchPersona: (persona: DemoPersona) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('veritas_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('veritas_user');
    const savedToken = localStorage.getItem('veritas_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem('veritas_user');
        localStorage.removeItem('veritas_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const data = await api.auth.login(username, password);
      setUser(data.user);
      setToken(data.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
  };

  const switchPersona = async (persona: DemoPersona) => {
    await login(persona.username, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchPersona
      }}
    >
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
