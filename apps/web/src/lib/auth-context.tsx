'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId?: string | null;
  phone?: string | null;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  country?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('billar_access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const res = await apiRequest<{ user: AuthUser; organization: AuthOrganization }>('/auth/me');
      setUser(res.user);
      setOrganization(res.organization);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('billar_access_token');
      localStorage.removeItem('billar_refresh_token');
      setUser(null);
      setOrganization(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{
      user: AuthUser;
      organization: AuthOrganization;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('billar_access_token', res.tokens.accessToken);
    localStorage.setItem('billar_refresh_token', res.tokens.refreshToken);
    setUser(res.user);
    setOrganization(res.organization);
    setToken(res.tokens.accessToken);
  };

  const register = async (data: any) => {
    const res = await apiRequest<{
      user: AuthUser;
      organization: AuthOrganization;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    localStorage.setItem('billar_access_token', res.tokens.accessToken);
    localStorage.setItem('billar_refresh_token', res.tokens.refreshToken);
    setUser(res.user);
    setOrganization(res.organization);
    setToken(res.tokens.accessToken);
  };

  const logout = () => {
    localStorage.removeItem('billar_access_token');
    localStorage.removeItem('billar_refresh_token');
    setUser(null);
    setOrganization(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
