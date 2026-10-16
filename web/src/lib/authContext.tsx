'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: 'SECRETARIO' | 'SUBSECRETARIO' | 'SECRETARIO_ADJUNTO' | 'SUPERINTENDENTE' | 'SUPERVISOR' | 'ASSESSOR' | 'TECNICO' | 'ADMIN';
  cargo_titulo: string;
  unidade_sigla: string;
  unidade_nome: string;
  caminho_hierarquico: string;
  isAdmin: boolean;
  avatar_iniciais: string;
}

export const DEMO_USERS: Record<string, AuthUser> = {
  servulo: {
    id: 'user-servulo',
    nome: 'Sérvulo José Freire Junior',
    email: 'servulo.junior@seduc.ma.gov.br',
    role: 'SUPERVISOR',
    cargo_titulo: 'Supervisor de Desenvolvimento de Sistemas (SUDES)',
    unidade_sigla: 'SUDES',
    unidade_nome: 'Supervisão de Desenvolvimento de Sistemas',
    caminho_hierarquico: 'SEDUC.SAAD.STI.SUDES',
    isAdmin: false,
    avatar_iniciais: 'SJ'
  },
  natalia: {
    id: 'user-natalia',
    nome: 'Natália Jansen de Carvalho',
    email: 'natalia.jansen@seduc.ma.gov.br',
    role: 'SUPERINTENDENTE',
    cargo_titulo: 'Superintendente de Tecnologia da Informação (STI)',
    unidade_sigla: 'STI',
    unidade_nome: 'Superintendência de Tecnologia da Informação',
    caminho_hierarquico: 'SEDUC.SAAD.STI',
    isAdmin: false,
    avatar_iniciais: 'NJ'
  },
  valter: {
    id: 'user-valter',
    nome: 'Valter Pereira Veras Neto',
    email: 'valter.veras@seduc.ma.gov.br',
    role: 'ASSESSOR',
    cargo_titulo: 'Assessor Chefe da Assessoria Jurídica (ASJUR)',
    unidade_sigla: 'ASJUR',
    unidade_nome: 'Assessoria Jurídica da SEDUC',
    caminho_hierarquico: 'SEDUC.ASJUR',
    isAdmin: false,
    avatar_iniciais: 'VV'
  },
  secretario: {
    id: 'user-secretario',
    nome: 'Dr. Jandir Silva Filho',
    email: 'gabinete@seduc.ma.gov.br',
    role: 'SECRETARIO',
    cargo_titulo: 'Secretário de Estado da Educação do Maranhão',
    unidade_sigla: 'GAB',
    unidade_nome: 'Gabinete do Secretário de Estado da Educação',
    caminho_hierarquico: 'SEDUC.GAB',
    isAdmin: false,
    avatar_iniciais: 'JS'
  },
  admin: {
    id: 'user-admin',
    nome: 'Administrador de Governança e TI',
    email: 'admin.pumip@seduc.ma.gov.br',
    role: 'ADMIN',
    cargo_titulo: 'Administrador de Segurança & Governança (STI)',
    unidade_sigla: 'STI',
    unidade_nome: 'Superintendência de Tecnologia da Informação',
    caminho_hierarquico: 'SEDUC.SAAD.STI',
    isAdmin: true,
    avatar_iniciais: 'AD'
  }
};

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
    // Simula validação com delay realista de autenticação
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Busca usuário correspondente ou atribui perfil adequado
    const foundUser = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      return true;
    }

    // Se o email for do domínio SEDUC, cria perfil institucional dinâmico
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

    // Padrão aceito em ambiente de homologação
    const defaultUser = DEMO_USERS.servulo;
    setUser(defaultUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    return true;
  };

  const loginAs = (profileKey: string) => {
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
