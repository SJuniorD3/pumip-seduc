'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AuthUser, DEMO_USERS } from './authUsers';
import { isDemoMode } from './appMode';
import { supabase, isSupabaseConfigured } from './supabase';

export type { AuthUser };
export { DEMO_USERS };

export const ANONYMOUS_USER: AuthUser = {
  id: '',
  nome: 'Visitante Institucional',
  email: '',
  role: 'TECNICO',
  cargo_titulo: 'Não Autenticado',
  unidade_sigla: '',
  unidade_nome: '',
  caminho_hierarquico: '',
  isAdmin: false,
  avatar_iniciais: 'VI'
};

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginAs: (profileKey: string) => void;
  logout: () => void | Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pumip_auth_user';

async function fetchUserProfileFromSupabase(userId: string, email: string): Promise<AuthUser | null> {
  try {
    const { data: perfil, error } = await supabase
      .from('perfis_usuarios')
      .select('*, unidade:unidades_organizacionais(*)')
      .eq('id', userId)
      .single();

    if (error || !perfil || !perfil.ativo) {
      console.warn('[PUMIP Auth] Perfil não localizado ou inativo:', error?.message);
      return null;
    }

    const nomeFormatado = perfil.nome || email.split('@')[0] || 'Usuário';
    const iniciais = nomeFormatado
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return {
      id: perfil.id,
      nome: perfil.nome,
      email: perfil.email || email,
      role: perfil.role,
      cargo_titulo: perfil.cargo_titulo || 'Servidor',
      unidade_sigla: perfil.unidade?.sigla || 'SEDUC',
      unidade_nome: perfil.unidade?.nome || 'Secretaria de Estado da Educação',
      caminho_hierarquico: perfil.unidade?.caminho_hierarquico || 'SEDUC',
      isAdmin: perfil.role === 'ADMIN',
      avatar_iniciais: iniciais || 'US'
    };
  } catch (err) {
    console.error('[PUMIP Auth] Erro inesperado ao consultar perfil:', err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(isDemoMode() ? DEMO_USERS.servulo : ANONYMOUS_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isDemoMode());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Carrega usuário da sessão persistida (Demo) ou Supabase Auth (Produção)
  useEffect(() => {
    if (isDemoMode()) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setIsAuthenticated(true);
        } else {
          setUser(DEMO_USERS.servulo);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn('Erro ao carregar sessão local:', e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Modo Produção: Restaura sessão do Supabase Auth
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const authUser = await fetchUserProfileFromSupabase(
            session.user.id,
            session.user.email || ''
          );
          if (authUser) {
            setUser(authUser);
            setIsAuthenticated(true);
          } else {
            setUser(ANONYMOUS_USER);
            setIsAuthenticated(false);
          }
        } else {
          setUser(ANONYMOUS_USER);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }).catch(() => {
        setUser(ANONYMOUS_USER);
        setIsAuthenticated(false);
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const authUser = await fetchUserProfileFromSupabase(
              session.user.id,
              session.user.email || ''
            );
            if (authUser) {
              setUser(authUser);
              setIsAuthenticated(true);
            }
          } else if (event === 'SIGNED_OUT' || !session) {
            setUser(ANONYMOUS_USER);
            setIsAuthenticated(false);
          }
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } else {
      setUser(ANONYMOUS_USER);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (isDemoMode()) {
      // Simula delay realista de autenticação
      await new Promise((resolve) => setTimeout(resolve, 500));

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
            .filter(Boolean)
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
    if (!isSupabaseConfigured()) {
      console.error('[PUMIP Auth] Modo produção requer configuração de Supabase URL e Anon Key.');
      return false;
    }

    if (!password) {
      console.error('[PUMIP Auth] Senha institucional é obrigatória em ambiente de produção.');
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error || !data.user) {
        console.error('[PUMIP Auth] Falha na validação de credenciais:', error?.message);
        return false;
      }

      const authUser = await fetchUserProfileFromSupabase(data.user.id, data.user.email || email);
      if (!authUser) {
        console.error('[PUMIP Auth] Perfil institucional não localizado ou usuário inativo.');
        await supabase.auth.signOut();
        return false;
      }

      setUser(authUser);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('[PUMIP Auth] Erro inesperado na autenticação:', err);
      return false;
    }
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

  const logout = async () => {
    if (isDemoMode()) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(DEMO_USERS.servulo);
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('[PUMIP Auth] Erro ao deslogar do Supabase:', e);
        }
      }
      setUser(ANONYMOUS_USER);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, loginAs, logout }}>
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
