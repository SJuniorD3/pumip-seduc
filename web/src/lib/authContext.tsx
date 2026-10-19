'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AuthUser, DEMO_USERS } from './authUsers';
import { isDemoMode } from './appMode';
export type { AuthUser };
export { DEMO_USERS };

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginAs: (profileKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pumip_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(DEMO_USERS.servulo);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const router = useRouter();

  // Carrega usuário da sessão persistida (localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsAuthenticated(true);
      } else {
        // Padrão de entrada
        setUser(DEMO_USERS.servulo);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão local:', e);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simula delay realista de autenticação
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (isDemoMode()) {
      // MODO DEMO: aceita perfis de teste para homologação
      const foundUser = Object.values(DEMO_USERS).find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (foundUser) {
        setUser(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
        return true;
      }

      // Em demo, aceita domínio SEDUC com perfil TECNICO
      if (email.endsWith('@seduc.ma.gov.br')) {
        const username = email.split('@')[0].replace('.', ' ');
        const nomeFormatado = username
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          nome: nomeFormatado,
          email: email.trim().toLowerCase(),
          role: 'TECNICO',
          cargo_titulo: 'Servidor / Técnico Operacional',
          unidade_sigla: 'SEDUC',
          unidade_nome: 'Secretaria de Estado da Educação',
          caminho_hierarquico: 'SEDUC',
          isAdmin: false,
          avatar_iniciais: nomeFormatado
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
        };

        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        return true;
      }

      // Em demo, padrão aceito para homologação
      const defaultUser = DEMO_USERS.servulo;
      setUser(defaultUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      return true;
    }

    // MODO PRODUÇÃO: autenticação real via Supabase Auth
    // TODO: Implementar integração com Supabase Auth / Gov.br OAuth
    console.error('[PUMIP Auth] Modo produção requer integração com Supabase Auth. Ainda não implementado.');
    return false;
  };

  const loginAs = (profileKey: string) => {
    if (!isDemoMode()) {
      console.warn('[PUMIP Auth] loginAs desabilitado em modo produção.');
      return;
    }
    const selected = DEMO_USERS[profileKey] || DEMO_USERS.servulo;
    setUser(selected);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
