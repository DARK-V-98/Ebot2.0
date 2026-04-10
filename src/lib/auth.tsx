// src/lib/auth.ts — Auth context + hooks
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { login as apiLogin, register as apiRegister, getMe } from './api';

interface Business {
  id: string;
  name: string;
  email: string;
  plan: string;
  api_key?: string;
  whatsapp_phone_id?: string;
}

interface AuthContextType {
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      getMe()
        .then(data => setBusiness(data))
        .catch(() => Cookies.remove('token', { path: '/' }))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    Cookies.set('token', data.token, { expires: 7, sameSite: 'lax', path: '/' });
    setBusiness(data.business);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRegister(name, email, password);
    Cookies.set('token', data.token, { expires: 7, sameSite: 'lax', path: '/' });
    setBusiness(data.business);
  };

  const logout = () => {
    Cookies.remove('token', { path: '/' });
    setBusiness(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ business, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
